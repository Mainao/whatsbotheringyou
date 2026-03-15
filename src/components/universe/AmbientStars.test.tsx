import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import AmbientStars from '@/components/universe/AmbientStars';

describe('AmbientStars', () => {
    let cancelRafMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            fillStyle: '',
            createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
            createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        } as unknown as CanvasRenderingContext2D);

        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        );

        cancelRafMock = vi.fn();
        vi.stubGlobal('cancelAnimationFrame', cancelRafMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders a canvas element', () => {
        const { container } = render(<AmbientStars />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('renders a canvas with the correct aria-label for accessibility', () => {
        const { container } = render(<AmbientStars />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toHaveAttribute('aria-label', 'Ambient background stars');
    });

    it('calls cancelAnimationFrame on unmount', () => {
        const { unmount } = render(<AmbientStars />);
        unmount();
        expect(cancelRafMock).toHaveBeenCalled();
    });
});
