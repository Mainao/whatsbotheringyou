import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DrawingCanvas from '@/components/add-star/DrawingCanvas';

import type { DrawingCanvasHandle } from '@/components/add-star/DrawingCanvas';

const mockCtx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: vi.fn(),
    strokeStyle: '' as string,
    fillStyle: '' as string,
    lineWidth: 0,
    lineCap: '' as string,
    lineJoin: '' as string,
    shadowBlur: 0,
    shadowColor: '' as string,
};

let observeSpy: ReturnType<typeof vi.fn>;
let toBlobSpy: ReturnType<typeof vi.fn>;
let capturedResizeCallback: (() => void) | null = null;

function simulateStroke(canvas: HTMLElement) {
    fireEvent.mouseDown(canvas);
    fireEvent.mouseMove(canvas, { buttons: 1 });
    fireEvent.mouseUp(canvas);
}

describe('DrawingCanvas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx.getImageData.mockReturnValue({
            data: new Uint8ClampedArray(4),
            width: 1,
            height: 1,
        });
        mockCtx.strokeStyle = '';
        mockCtx.fillStyle = '';
        mockCtx.lineWidth = 0;
        mockCtx.shadowBlur = 0;
        mockCtx.shadowColor = '';

        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            mockCtx as unknown as CanvasRenderingContext2D,
        );
        toBlobSpy = vi
            .spyOn(HTMLCanvasElement.prototype, 'toBlob')
            .mockImplementation((callback) => {
                callback(new Blob(['test'], { type: 'image/jpeg' }));
            }) as unknown as ReturnType<typeof vi.fn>;

        capturedResizeCallback = null;
        observeSpy = vi.fn();
        global.ResizeObserver = vi.fn().mockImplementation((cb: () => void) => {
            capturedResizeCallback = cb;
            return { observe: observeSpy, disconnect: vi.fn(), unobserve: vi.fn() };
        });
    });

    // --- rendering ---

    it('renders a canvas with the correct aria-label', () => {
        render(<DrawingCanvas />);
        expect(screen.getByLabelText(/drawing canvas/i)).toBeInTheDocument();
    });

    it('canvas has correct CSS classes', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        expect(canvas).toHaveClass(
            'block',
            'h-[260px]',
            'w-full',
            'cursor-crosshair',
            'touch-none',
            'rounded-xl',
            'bg-bg-base',
        );
    });

    it('wrapper div has class "relative"', () => {
        const { container } = render(<DrawingCanvas />);
        expect(container.firstElementChild).toHaveClass('relative');
    });

    // --- ResizeObserver ---

    it('attaches a ResizeObserver to the canvas on mount', () => {
        render(<DrawingCanvas />);
        expect(observeSpy).toHaveBeenCalledTimes(1);
    });

    // --- colour and size initialisation ---

    it('applies colour layers derived from the default chosenColour during a stroke', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        simulateStroke(canvas);
        // continueStroke draws three layers; the last (white highlight) is set last
        expect(mockCtx.strokeStyle).toBe('rgba(255, 255, 255, 0.9)');
    });

    it('applies stroke size of 6 during a stroke', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        simulateStroke(canvas);
        // continueStroke draws three layers; the last layer width is size * 0.25 = 1.5
        expect(mockCtx.lineWidth).toBe(1.5);
    });

    // --- onBlankChange ---

    it('calls onBlankChange(true) on mount', () => {
        const onBlankChange = vi.fn();
        render(<DrawingCanvas onBlankChange={onBlankChange} />);
        expect(onBlankChange).toHaveBeenCalledWith(true);
    });

    it('calls onBlankChange(false) after a stroke', () => {
        const onBlankChange = vi.fn();
        render(<DrawingCanvas onBlankChange={onBlankChange} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        expect(onBlankChange).toHaveBeenCalledWith(false);
    });

    it('calls onBlankChange(true) after clearCanvas', () => {
        const ref = createRef<DrawingCanvasHandle>();
        const onBlankChange = vi.fn();
        render(<DrawingCanvas ref={ref} onBlankChange={onBlankChange} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        act(() => {
            ref.current?.clearCanvas();
        });
        expect(onBlankChange).toHaveBeenLastCalledWith(true);
    });

    // --- imperative handle: initial state ---

    it('exposes isBlank: true via the ref initially', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        expect(ref.current?.isBlank).toBe(true);
    });

    it('exposes strokeCount: 0 via the ref initially', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        expect(ref.current?.strokeCount).toBe(0);
    });

    // --- imperative handle: after stroke ---

    it('isBlank becomes false after a stroke', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        expect(ref.current?.isBlank).toBe(false);
    });

    it('strokeCount becomes 1 after one stroke', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        expect(ref.current?.strokeCount).toBe(1);
    });

    it('strokeCount increments with each stroke', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        simulateStroke(canvas);
        simulateStroke(canvas);
        simulateStroke(canvas);
        expect(ref.current?.strokeCount).toBe(3);
    });

    // --- clearCanvas ---

    it('clearCanvas resets isBlank to true', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        act(() => {
            ref.current?.clearCanvas();
        });
        expect(ref.current?.isBlank).toBe(true);
    });

    it('clearCanvas resets strokeCount to 0', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        simulateStroke(canvas);
        simulateStroke(canvas);
        act(() => {
            ref.current?.clearCanvas();
        });
        expect(ref.current?.strokeCount).toBe(0);
    });

    // --- undo ---

    it('undo after one stroke resets isBlank to true', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        act(() => {
            ref.current?.undo();
        });
        expect(ref.current?.isBlank).toBe(true);
    });

    it('undo after one stroke resets strokeCount to 0', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        simulateStroke(screen.getByLabelText(/drawing canvas/i));
        act(() => {
            ref.current?.undo();
        });
        expect(ref.current?.strokeCount).toBe(0);
    });

    it('undo after two strokes leaves strokeCount at 1 and isBlank false', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        simulateStroke(canvas);
        simulateStroke(canvas);
        act(() => {
            ref.current?.undo();
        });
        expect(ref.current?.strokeCount).toBe(1);
        expect(ref.current?.isBlank).toBe(false);
    });

    // --- mouse events ---

    it('mouseLeave ends the stroke', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.mouseDown(canvas);
        fireEvent.mouseMove(canvas, { buttons: 1 });
        fireEvent.mouseLeave(canvas);
        expect(ref.current?.isBlank).toBe(false);
        expect(ref.current?.strokeCount).toBe(1);
    });

    it('tap without drag does not change isBlank or strokeCount', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.mouseDown(canvas);
        fireEvent.mouseUp(canvas);
        expect(ref.current?.isBlank).toBe(true);
        expect(ref.current?.strokeCount).toBe(0);
    });

    it('mousemove with buttons=0 does not call lineTo', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.mouseDown(canvas);
        fireEvent.mouseMove(canvas, { buttons: 0 });
        fireEvent.mouseUp(canvas);
        expect(mockCtx.lineTo).not.toHaveBeenCalled();
    });

    // --- touch events ---

    it('touch stroke changes isBlank to false', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 50 }] });
        fireEvent.touchMove(canvas, { touches: [{ clientX: 60, clientY: 60 }] });
        fireEvent.touchEnd(canvas);
        expect(ref.current?.isBlank).toBe(false);
    });

    it('touch stroke increments strokeCount', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 50 }] });
        fireEvent.touchMove(canvas, { touches: [{ clientX: 60, clientY: 60 }] });
        fireEvent.touchEnd(canvas);
        expect(ref.current?.strokeCount).toBe(1);
    });

    // --- exportBlob ---

    it('exportBlob resolves to a Blob', async () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const blob = await ref.current?.exportBlob();
        expect(blob).toBeInstanceOf(Blob);
    });

    it('exportBlob fills the offscreen canvas background with #0D1117', async () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        await ref.current?.exportBlob();
        expect(mockCtx.fillStyle).toBe('#0D1117');
        expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
    });

    it('exportBlob calls toBlob with mime type image/jpeg and quality 0.6', async () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        await ref.current?.exportBlob();
        expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.6);
    });

    // --- syncSize (ResizeObserver callback) ---

    it('syncSize does not run initGrid when dimensions are zero on mount', () => {
        render(<DrawingCanvas />);
        // jsdom offsetWidth/offsetHeight default to 0 — syncSize early-returns
        expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('syncSize sets canvas dimensions and runs initGrid on first resize', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        Object.defineProperty(canvas, 'offsetWidth', { get: () => 300, configurable: true });
        Object.defineProperty(canvas, 'offsetHeight', { get: () => 200, configurable: true });
        act(() => {
            capturedResizeCallback?.();
        });
        // initGrid draws the grid using beginPath/stroke
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('syncSize skips resize when canvas dimensions are already up to date', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        Object.defineProperty(canvas, 'offsetWidth', { get: () => 300, configurable: true });
        Object.defineProperty(canvas, 'offsetHeight', { get: () => 200, configurable: true });
        act(() => {
            capturedResizeCallback?.();
        });
        vi.clearAllMocks();
        // Fire again with the same dimensions — should be a no-op
        act(() => {
            capturedResizeCallback?.();
        });
        expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('syncSize copies the existing bitmap when resizing from non-zero dimensions', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        // First resize: canvas starts at 0×0, else branch sets it to 300×200
        Object.defineProperty(canvas, 'offsetWidth', { get: () => 300, configurable: true });
        Object.defineProperty(canvas, 'offsetHeight', { get: () => 200, configurable: true });
        act(() => {
            capturedResizeCallback?.();
        });
        vi.clearAllMocks();
        // Second resize to a larger size — canvas.width(300) > 0, triggers bitmap-copy path
        Object.defineProperty(canvas, 'offsetWidth', { get: () => 400, configurable: true });
        Object.defineProperty(canvas, 'offsetHeight', { get: () => 300, configurable: true });
        act(() => {
            capturedResizeCallback?.();
        });
        // The bitmap-copy path calls drawImage to preserve the existing content
        expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    // --- setColour via ref ---

    it('setColour via ref applies the new colour to the canvas context during a stroke', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);

        const strokeStyleValues: string[] = [];
        const shadowColorValues: string[] = [];
        Object.defineProperty(mockCtx, 'strokeStyle', {
            set(v: string) {
                strokeStyleValues.push(v);
            },
            get() {
                return strokeStyleValues[strokeStyleValues.length - 1] ?? '';
            },
            configurable: true,
        });
        Object.defineProperty(mockCtx, 'shadowColor', {
            set(v: string) {
                shadowColorValues.push(v);
            },
            get() {
                return shadowColorValues[shadowColorValues.length - 1] ?? '';
            },
            configurable: true,
        });

        try {
            act(() => {
                ref.current?.setColour('#FF0000');
            });
            simulateStroke(screen.getByLabelText(/drawing canvas/i));

            // Layer 2 (core stroke) sets strokeStyle to the active colour at full opacity
            expect(strokeStyleValues).toContain('rgba(255, 0, 0, 1)');
            // Layer 1 (glow) sets shadowColor to the active colour
            expect(shadowColorValues).toContain('#FF0000');
            expect(ref.current?.strokeCount).toBe(1);
            expect(ref.current?.isBlank).toBe(false);
        } finally {
            // Restore plain writable properties so subsequent tests are unaffected
            Object.defineProperty(mockCtx, 'strokeStyle', {
                value: '',
                writable: true,
                configurable: true,
                enumerable: true,
            });
            Object.defineProperty(mockCtx, 'shadowColor', {
                value: '',
                writable: true,
                configurable: true,
                enumerable: true,
            });
        }
    });

    // --- touchCancel ---

    it('touchCancel cancels the active stroke without committing it', () => {
        const ref = createRef<DrawingCanvasHandle>();
        render(<DrawingCanvas ref={ref} />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 50 }] });
        fireEvent.touchMove(canvas, { touches: [{ clientX: 60, clientY: 60 }] });
        fireEvent.touchCancel(canvas);
        expect(ref.current?.isBlank).toBe(true);
        expect(ref.current?.strokeCount).toBe(0);
    });
});
