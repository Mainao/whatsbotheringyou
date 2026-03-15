import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import UniverseCanvas from '@/components/universe/UniverseCanvas';

describe('UniverseCanvas', () => {
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
        const { container } = render(<UniverseCanvas />);
        expect(container).toBeInTheDocument();
    });

    it('renders the ambient stars canvas with its aria-label', () => {
        const { container } = render(<UniverseCanvas />);
        const ambientCanvas = container.querySelector(
            'canvas[aria-label="Ambient background stars"]',
        );
        expect(ambientCanvas).toBeInTheDocument();
    });

    it('renders canvas elements for the star animations', () => {
        const { container } = render(<UniverseCanvas />);
        const canvases = container.querySelectorAll('canvas');
        expect(canvases.length).toBeGreaterThanOrEqual(1);
    });
});
