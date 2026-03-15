import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ShootingStar from '@/components/universe/ShootingStar';

describe('ShootingStar', () => {
    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            lineWidth: 0,
            strokeStyle: '',
            createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
            createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        } as unknown as CanvasRenderingContext2D);

        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders without crashing', () => {
        const { container } = render(<ShootingStar />);
        expect(container).toBeInTheDocument();
    });

    it('renders a canvas element', () => {
        const { container } = render(<ShootingStar />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('calls clearTimeout on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
        const { unmount } = render(<ShootingStar />);
        unmount();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('does not render visible text content between shots', () => {
        const { container } = render(<ShootingStar />);
        expect(container.textContent).toBe('');
    });
});
