export default function (
    _ctx: Context,
    opts: { agent: types.agent.Agent; event: types.agent.LiveEvent },
): void {
    for (const subscriber of Array.from(opts.agent.subscribers)) {
        try {
            subscriber.onEvent(opts.event);
        } catch (error) {
            opts.agent.subscribers.delete(subscriber);
            try { subscriber.onError?.(error); } catch {}
        }
    }
}
