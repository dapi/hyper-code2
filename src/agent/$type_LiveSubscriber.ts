export type LiveSubscriber = {
    onEvent: (event: types.agent.LiveEvent) => void;
    onError?: (error: unknown) => void;
};
