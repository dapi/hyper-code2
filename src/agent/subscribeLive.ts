export default function (
    _ctx: Context,
    opts: { agent: types.agent.Agent; subscriber: types.agent.LiveSubscriber },
): () => void {
    opts.agent.subscribers.add(opts.subscriber);
    let active = true;
    return () => {
        if (!active) return;
        active = false;
        opts.agent.subscribers.delete(opts.subscriber);
    };
}
