import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DrawingCanvas from '@/components/add-star/DrawingCanvas';

import type { DrawingCanvasHandle } from '@/components/add-star/DrawingCanvas';

const mockCtx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: vi.fn(),
    strokeStyle: '' as string,
    lineWidth: 0,
    lineCap: '' as string,
    lineJoin: '' as string,
};

let observeSpy: ReturnType<typeof vi.fn>;

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
        mockCtx.lineWidth = 0;

        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            mockCtx as unknown as CanvasRenderingContext2D,
        );
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(new Blob(['test'], { type: 'image/png' }));
        });

        observeSpy = vi.fn();
        global.ResizeObserver = vi.fn().mockImplementation(() => ({
            observe: observeSpy,
            disconnect: vi.fn(),
            unobserve: vi.fn(),
        }));
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

    it('initialises stroke colour to #FFFFFF on mount', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.mouseDown(canvas);
        expect(mockCtx.strokeStyle).toBe('#FFFFFF');
    });

    it('initialises stroke size to 6 on mount', () => {
        render(<DrawingCanvas />);
        const canvas = screen.getByLabelText(/drawing canvas/i);
        fireEvent.mouseDown(canvas);
        expect(mockCtx.lineWidth).toBe(6);
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
});
