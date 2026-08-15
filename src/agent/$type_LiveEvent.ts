type BaseLiveEvent = {
    version: 1;
    agentId: string;
    runId: string;
    seq: number;
};

type ModelCallLiveEvent = BaseLiveEvent & { callId: string };

export type LiveEvent =
    | BaseLiveEvent & { type: 'run_started' }
    | ModelCallLiveEvent & { type: 'model_call_started' }
    | ModelCallLiveEvent & { type: 'thinking_delta'; delta: string }
    | ModelCallLiveEvent & { type: 'text_delta'; delta: string }
    | ModelCallLiveEvent & { type: 'model_call_finished' }
    | BaseLiveEvent & {
        type: 'run_finished';
        outcome: 'completed' | 'stopped' | 'failed';
        reason?: string;
        error?: string;
    };
