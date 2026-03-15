import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ShootingStar from '@/components/universe/ShootingStar';

describe('ShootingStar', () => {
    let rafCallback: FrameRequestCallback | null = null;
    let rafMock: ReturnType<typeof vi.fn>;
    let cancelRafMock: ReturnType<typeof vi.fn>;
    let mockCtx: {
        clearRect: ReturnType<typeof vi.fn>;
        beginPath: ReturnType<typeof vi.fn>;
        moveTo: ReturnType<typeof vi.fn>;
        lineTo: ReturnType<typeof vi.fn>;
        stroke: ReturnType<typeof vi.fn>;
        scale: ReturnType<typeof vi.fn>;
        fillStyle: string;
        strokeStyle: string;
        lineWidth: number;
        createLinearGradient: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.useFakeTimers();

        mockCtx = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            scale: vi.fn(),
            fillStyle: '' as string,
            strokeStyle: '' as string,
            lineWidth: 0,
            createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn(),
            })),
        };

        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
            () => mockCtx as unknown as CanvasRenderingContext2D,
        );

        rafMock = vi.fn((cb: FrameRequestCallback) => {
            rafCallback = cb;
            return 0;
        });
        vi.stubGlobal('requestAnimationFrame', rafMock);

        cancelRafMock = vi.fn();
        vi.stubGlobal('cancelAnimationFrame', cancelRafMock);

        vi.stubGlobal('performance', { now: vi.fn(() => 0) });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        rafCallback = null;
    });

    it('renders a canvas element', () => {
        const { container } = render(<ShootingStar />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('canvas has pointer-events-none class', () => {
        const { container } = render(<ShootingStar />);
        const canvas = container.querySelector('canvas');
        expect(canvas?.className).toContain('pointer-events-none');
    });

    it('canvas has z-index 1 in style', () => {
        const { container } = render(<ShootingStar />);
        const canvas = container.querySelector('canvas');
        expect(canvas?.style.zIndex).toBe('1');
    });

    it('calls requestAnimationFrame after the startup timer fires', () => {
        render(<ShootingStar />);
        act(() => {
            vi.advanceTimersByTime(3_001);
        });
        expect(rafMock).toHaveBeenCalled();
    });

    it('calls cancelAnimationFrame with the correct handle on unmount', () => {
        const { unmount } = render(<ShootingStar />);

        // RAF is scheduled immediately on mount — get the handle
        const rafHandle = (global.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.results[0]
            ?.value as number;

        // Advance timers to let startup scheduling run
        act(() => {
            vi.advanceTimersByTime(3001);
        });

        unmount();

        expect(cancelRafMock).toHaveBeenCalledWith(rafHandle);
        expect(cancelRafMock).toHaveBeenCalledTimes(1);
    });

    it('clears the canvas on each animation frame', () => {
        render(<ShootingStar />);
        act(() => {
            vi.advanceTimersByTime(3_001);
        });
        act(() => {
            rafCallback?.(100);
        });
        expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('schedules a shooting star after timeout fires', () => {
        render(<ShootingStar />);
        act(() => {
            vi.advanceTimersByTime(90_001);
        });
        act(() => {
            rafCallback?.(200);
        });
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.moveTo).toHaveBeenCalled();
        expect(mockCtx.lineTo).toHaveBeenCalled();
        expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('creates a linear gradient for the shooting star', () => {
        render(<ShootingStar />);
        act(() => {
            vi.advanceTimersByTime(90_001);
        });
        act(() => {
            rafCallback?.(200);
        });
        expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });

    it('resets active star and schedules next when animation completes', () => {
        render(<ShootingStar />);
        act(() => {
            vi.advanceTimersByTime(90_001);
        });
        // timestamp 2000 > max duration 1400 → progress clamps to 1 → activeStar reset
        act(() => {
            rafCallback?.(2000);
        });
        expect(mockCtx.clearRect).toHaveBeenCalled();
        expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('removes resize event listener on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(<ShootingStar />);
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('clears timeout on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
        const { unmount } = render(<ShootingStar />);
        unmount();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
});
