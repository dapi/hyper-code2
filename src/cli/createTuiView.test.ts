import { afterEach, describe, expect, test } from 'bun:test';
import { createTestRenderer } from '@opentui/core/testing';
import createTuiView from './createTuiView.entry';

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

describe('createTuiView', () => {
    test('renders stable status, trusted warning, transcript, and HTML fallback', async () => {
        const setup = await createTestRenderer({ width: 82, height: 24 });
        cleanups.push(() => setup.renderer.destroy());
        const view = createTuiView(setup.renderer, {
            workspace: '/work/project',
            model: 'mock:test',
            onSubmit: () => {},
            onInterrupt: () => {},
            onExit: () => {},
        });
        cleanups.push(view.dispose);
        view.setTranscript(
            'You\n  hello\n\nAssistant\n  [HTML response available in browser mode only]',
        );
        view.setRunState('running');
        await setup.renderOnce();

        const frame = setup.captureCharFrame();
        expect(frame).toContain('TRUSTED MODE — unrestricted agent execution');
        expect(frame).toContain('workspace /work/project');
        expect(frame).toContain('model mock:test');
        expect(frame).toContain('running');
        expect(frame).toContain(
            '[HTML response available in browser mode only]',
        );
    });

    test('keeps Enter multiline and submits Ctrl+Enter once', async () => {
        const setup = await createTestRenderer({
            width: 70,
            height: 20,
            kittyKeyboard: true,
        });
        cleanups.push(() => setup.renderer.destroy());
        const submissions: string[] = [];
        const view = createTuiView(setup.renderer, {
            workspace: '/work',
            model: 'mock:test',
            onSubmit: (text) => submissions.push(text),
            onInterrupt: () => {},
            onExit: () => {},
        });
        cleanups.push(view.dispose);
        await setup.mockInput.typeText('first');
        setup.mockInput.pressEnter();
        await setup.mockInput.typeText('second');
        setup.mockInput.pressEnter({ ctrl: true });
        await setup.flush();

        expect(submissions).toEqual(['first\nsecond']);
        expect(view.composer.plainText).toBe('first\nsecond');
    });

    test('labels every residual partial projection with its failed outcome', async () => {
        const setup = await createTestRenderer({ width: 70, height: 20 });
        cleanups.push(() => setup.renderer.destroy());
        const view = createTuiView(setup.renderer, {
            workspace: '/work',
            model: 'mock:test',
            onSubmit: () => {},
            onInterrupt: () => {},
            onExit: () => {},
        });
        cleanups.push(view.dispose);
        await setup.renderOnce();
        view.setLive({
            thinking: 'unfinished reasoning',
            outcome: 'failed',
        });
        await setup.renderOnce();

        const thinkingFrame = setup.captureCharFrame();
        expect(thinkingFrame).toContain(
            '[thinking · failed] unfinished reasoning',
        );
        expect(thinkingFrame).not.toContain('[thinking · live]');

        view.setLive({ assistant: 'unfinished answer', outcome: 'failed' });
        await setup.renderOnce();
        expect(setup.captureCharFrame()).toContain(
            '[assistant · failed] unfinished answer',
        );
    });

    test('preserves warning after resize and supports explicit scroll', async () => {
        const setup = await createTestRenderer({ width: 50, height: 14 });
        cleanups.push(() => setup.renderer.destroy());
        const view = createTuiView(setup.renderer, {
            workspace: '/work',
            model: 'mock:test',
            onSubmit: () => {},
            onInterrupt: () => {},
            onExit: () => {},
        });
        cleanups.push(view.dispose);
        view.setTranscript(
            Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n'),
        );
        await setup.renderOnce();
        const bottomFrame = setup.captureCharFrame();
        view.scrollBy(-5);
        await setup.renderOnce();
        const scrolledFrame = setup.captureCharFrame();

        expect(scrolledFrame).not.toBe(bottomFrame);
        expect(scrolledFrame).toContain('line 21');
        expect(bottomFrame).not.toContain('line 21');

        setup.resize(72, 18);
        await setup.renderOnce();

        expect(setup.captureCharFrame()).toContain(
            'TRUSTED MODE — unrestricted agent execution',
        );
    });
});
