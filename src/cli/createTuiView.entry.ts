import {
    BoxRenderable,
    ScrollBoxRenderable,
    TextareaRenderable,
    TextRenderable,
    type CliRenderer,
    type KeyEvent,
} from '@opentui/core';
import { productLabel } from './productInfo.entry';

export type TuiViewOptions = {
    workspace: string;
    model: string;
    version: string;
    onSubmit: (text: string) => void;
    onInterrupt: () => void;
    onExit: () => void;
};

export type TuiView = {
    composer: TextareaRenderable;
    setTranscript: (text: string) => void;
    setLive: (state: {
        thinking?: string;
        assistant?: string;
        outcome?: 'stopped' | 'failed';
    }) => void;
    setRunState: (state: 'idle' | 'running' | 'stopping' | 'failed') => void;
    scrollBy: (rows: number) => void;
    dispose: () => void;
};

export default function createTuiView(
    renderer: CliRenderer,
    opts: TuiViewOptions,
): TuiView {
    const root = new BoxRenderable(renderer, {
        id: 'hcode-root',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        backgroundColor: '#0b0f14',
    });
    const brand = new TextRenderable(renderer, {
        id: 'brand',
        height: 1,
        content: ` ${productLabel(opts.version)}`,
        fg: '#7dcfff',
        bg: '#101b26',
    });
    const trusted = new TextRenderable(renderer, {
        id: 'trusted-mode',
        height: 1,
        content: ' TRUSTED MODE — unrestricted agent execution',
        fg: '#ffcc66',
        bg: '#3a2500',
    });
    const status = new TextRenderable(renderer, {
        id: 'status',
        height: 1,
        content: statusText(opts.workspace, opts.model, 'idle'),
        fg: '#8bd5ff',
        bg: '#12202d',
    });
    const conversationScroll = new ScrollBoxRenderable(renderer, {
        id: 'conversation-scroll',
        flexGrow: 1,
        minHeight: 3,
        border: true,
        borderColor: '#34495e',
        title: ' Conversation ',
        paddingX: 1,
        scrollY: true,
        stickyScroll: true,
        stickyStart: 'bottom',
    });
    const conversation = new TextRenderable(renderer, {
        id: 'conversation',
        width: '100%',
        height: 'auto',
        content: 'Ready. Write a task below.',
        fg: '#d8dee9',
        wrapMode: 'word',
    });
    conversationScroll.content.add(conversation);
    const composerBox = new BoxRenderable(renderer, {
        id: 'composer-box',
        height: 5,
        border: true,
        borderColor: '#4c7899',
        focusedBorderColor: '#7dcfff',
        title: ' Message • Ctrl+Enter send ',
        paddingX: 1,
    });
    const composer = new TextareaRenderable(renderer, {
        id: 'composer',
        width: '100%',
        height: '100%',
        placeholder: 'Describe the task…',
        textColor: '#f2f4f8',
        cursorColor: '#7dcfff',
        wrapMode: 'word',
        keyBindings: [{ name: 'return', ctrl: true, action: 'submit' }],
        onSubmit: () => {
            const text = composer.plainText.trim();
            if (!text) return;
            opts.onSubmit(text);
        },
    });
    composerBox.add(composer);
    const help = new TextRenderable(renderer, {
        id: 'help',
        height: 1,
        content:
            ' Ctrl+C stop / exit idle   Ctrl+D exit empty   PgUp/PgDn scroll   Enter newline ',
        fg: '#8996a8',
        bg: '#111820',
    });

    root.add(brand);
    root.add(trusted);
    root.add(status);
    root.add(conversationScroll);
    root.add(composerBox);
    root.add(help);
    renderer.root.add(root);
    composer.focus();

    let transcript = '';
    let live: {
        thinking?: string;
        assistant?: string;
        outcome?: 'stopped' | 'failed';
    } = {};
    let disposed = false;
    let workingSince: number | undefined;
    let workingTimer: ReturnType<typeof setInterval> | undefined;
    const clearWorkingTimer = () => {
        if (workingTimer !== undefined) {
            clearInterval(workingTimer);
            workingTimer = undefined;
        }
        workingSince = undefined;
    };
    const renderStatus = (state: 'idle' | 'running' | 'stopping' | 'failed') => {
        if (state === 'running') {
            if (workingSince === undefined) workingSince = Date.now();
            status.content = workingStatusText(
                opts.workspace,
                opts.model,
                Math.floor((Date.now() - workingSince) / 1000),
            );
            if (workingTimer === undefined) {
                workingTimer = setInterval(() => {
                    if (disposed || workingSince === undefined) return;
                    status.content = workingStatusText(
                        opts.workspace,
                        opts.model,
                        Math.floor((Date.now() - workingSince) / 1000),
                    );
                    renderer.requestRender();
                }, 1000);
            }
        } else {
            clearWorkingTimer();
            status.content = statusText(opts.workspace, opts.model, state);
        }
    };
    const renderConversation = () => {
        const blocks = [transcript.trimEnd()];
        const liveSuffix = live.outcome ? ` · ${live.outcome}` : ' · live';
        if (live.thinking)
            blocks.push(`[thinking${liveSuffix}] ${live.thinking}`);
        if (live.assistant) {
            blocks.push(`[assistant${liveSuffix}] ${live.assistant}`);
        }
        conversation.content =
            blocks.filter(Boolean).join('\n\n') || 'Ready. Write a task below.';
        renderer.requestRender();
    };
    const onKeypress = (key: KeyEvent) => {
        if (
            key.ctrl &&
            ['return', 'enter', 'linefeed', 'kpenter'].includes(key.name)
        ) {
            key.preventDefault();
            key.stopPropagation();
            composer.submit();
        } else if (key.ctrl && key.name === 'c') {
            key.preventDefault();
            key.stopPropagation();
            opts.onInterrupt();
        } else if (key.name === 'escape') {
            key.preventDefault();
            key.stopPropagation();
            opts.onInterrupt();
        } else if (
            key.ctrl &&
            key.name === 'd' &&
            composer.plainText.length === 0
        ) {
            key.preventDefault();
            key.stopPropagation();
            opts.onExit();
        } else if (key.name === 'pageup') {
            key.preventDefault();
            conversationScroll.scrollBy(
                -Math.max(1, Math.floor(renderer.height / 2)),
            );
        } else if (key.name === 'pagedown') {
            key.preventDefault();
            conversationScroll.scrollBy(
                Math.max(1, Math.floor(renderer.height / 2)),
            );
        }
    };
    renderer.keyInput.on('keypress', onKeypress);

    return {
        composer,
        setTranscript: (text) => {
            transcript = text;
            renderConversation();
        },
        setLive: (state) => {
            live = state;
            renderConversation();
        },
        setRunState: (state) => {
            renderStatus(state);
            renderer.requestRender();
        },
        scrollBy: (rows) => conversationScroll.scrollBy(rows),
        dispose: () => {
            if (disposed) return;
            disposed = true;
            clearWorkingTimer();
            renderer.keyInput.off('keypress', onKeypress);
        },
    };
}

function statusText(workspace: string, model: string, state: string): string {
    return ` workspace ${workspace}  •  model ${model}  •  ${state}`;
}

function workingStatusText(
    workspace: string,
    model: string,
    elapsedSeconds: number,
): string {
    return ` workspace ${workspace}  •  model ${model}  •  ◦ Working (${elapsedSeconds}s • esc to interrupt)`;
}
