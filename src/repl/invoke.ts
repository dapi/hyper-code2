// Managed invocation boundary for generation-owned reload lifecycle.
// Contract: memory-bank/features/FT-046/design.md#contract

const FUNCTION_SOURCE_WRAPPED_IDENTITY = Symbol.for('hyper-code2.function-source.wrapped-function');
const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');

export default async function (
    ctx: Context,
    request: { name: string; opts?: any },
) {
    const fn = resolveFunction(ctx, request.name);
    if (!fn) throw new Error(`function unavailable: ${request.name}`);

    const lifecycle = ensureLifecycle(ctx);
    const receipt = ownRegistryValue((ctx.state as any)?.functionSources, request.name);
    // A runtime upgraded in place can already have loader receipts and live
    // procedures, but no transient lifecycle registry yet. Adopt only a
    // receipt whose hidden identity still matches the callable we resolved;
    // hand-written/stale receipts must remain unavailable.
    seedActiveFromReceipt(ctx, lifecycle, receipt, request.name, fn);
    const active = ownRegistryValue(lifecycle.active, request.name);
    if (!receipt || !active
        || receipt.generation !== active.generation
        || active.fn !== loadedIdentity(fn)) {
        throw new Error(`function unavailable: ${request.name}`);
    }
    const generationKey = `${request.name}@${active.generation}`;
    const lease = ownRegistryValue(lifecycle.retired, generationKey) ?? active;
    lease.leases = (lease.leases ?? 0) + 1;
    try {
        // Invoke the public callable, not its recorded implementation: runtime
        // wrappers provide shutdown gating/accounting and synchronously select
        // the same implementation whose generation was leased above.
        return await fn(ctx, request.opts ?? {});
    } finally {
        lease.leases -= 1;
        const retired = ownRegistryValue(lifecycle.retired, generationKey);
        if (retired && lease.leases === 0) disposeWhenQuiescent(ctx, generationKey, retired);
    }
}

function seedActiveFromReceipt(ctx: Context, lifecycle: any, receipt: any, name: string, fn: Function) {
    if (ownRegistryValue(lifecycle.active, name)
        || !receipt
        || !Number.isInteger(receipt.generation)
        || receipt[FUNCTION_SOURCE_IDENTITY] !== loadedIdentity(fn)) return;
    lifecycle.active[name] = { generation: receipt.generation, fn: loadedIdentity(fn) };
    const state = (ctx as any).state;
    state.functionSourceGeneration = Math.max(state.functionSourceGeneration ?? 0, receipt.generation);
}

function loadedIdentity(fn: Function) {
    const wrapped = (fn as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY];
    return typeof wrapped === 'function' ? wrapped : fn;
}

function resolveFunction(ctx: Context, name: string) {
    const parts = name.split('.');
    let value: any = parts.length === 1 ? ctx : ctx.fns;
    for (const part of parts) {
        if (!value || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
        value = value[part];
    }
    return typeof value === 'function' ? value : undefined;
}

function ensureLifecycle(ctx: Context) {
    const state = ((ctx as any).state ??= {});
    const lifecycle = (state.functionLifecycle ??= {
        active: createRegistry(),
        retired: createRegistry(),
        unavailable: createRegistry(),
        disposalErrors: [],
    });
    if (!lifecycle.retiredIdentities) {
        lifecycle.retiredIdentities = new WeakSet<Function>();
        for (const retired of Object.values(lifecycle.retired) as any[]) {
            if (retired?.disposeStarted && typeof retired?.fn === 'function') {
                lifecycle.retiredIdentities.add(retired.fn);
            }
        }
    }
    return lifecycle;
}

function createRegistry() {
    return Object.create(null) as Record<string, any>;
}

function ownRegistryValue(registry: any, key: string) {
    return registry && Object.prototype.hasOwnProperty.call(registry, key)
        ? registry[key]
        : undefined;
}

function disposeWhenQuiescent(ctx: Context, key: string, retired: any) {
    if (retired.disposeStarted || retired.leases > 0) return;
    const lifecycle = ensureLifecycle(ctx);
    if (hasActiveIdentity(lifecycle, retired.fn) || hasIdentityLeases(lifecycle, retired.fn)) return;
    if (hasStartedIdentityDisposal(lifecycle, retired.fn)) return;

    let dispose: unknown;
    try {
        dispose = retired.fn && (retired.fn as any).dispose;
    } catch (error) {
        recordDisposalError(ctx, key, error);
        releaseRetiredIdentity(ctx, retired.fn);
        return;
    }
    if (typeof dispose !== 'function') {
        releaseRetiredIdentity(ctx, retired.fn);
        return;
    }

    retired.disposeStarted = true;
    lifecycle.retiredIdentities.add(retired.fn);
    Promise.resolve().then(() => (dispose as Function)(ctx)).then(() => {
        retired.disposed = true;
    }).catch((error) => {
        recordDisposalError(ctx, key, error);
    }).finally(() => {
        releaseRetiredIdentity(ctx, retired.fn);
    });
}

function hasActiveIdentity(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.active).some((active: any) => active?.fn === fn);
}

function hasIdentityLeases(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.retired).some((record: any) => record?.fn === fn && record.leases > 0);
}

function hasStartedIdentityDisposal(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.retired).some((record: any) => record?.fn === fn && record.disposeStarted);
}

function releaseRetiredIdentity(ctx: Context, fn: Function) {
    const lifecycle = ensureLifecycle(ctx);
    for (const [key, record] of Object.entries(lifecycle.retired) as any[]) {
        if (record?.fn === fn && record.leases === 0) delete lifecycle.retired[key];
    }
}

function recordDisposalError(ctx: Context, key: string, error: unknown) {
    ensureLifecycle(ctx).disposalErrors.push({
        key,
        message: error instanceof Error ? error.message : String(error),
        recordedAt: new Date().toISOString(),
    });
}
