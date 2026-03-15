import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import UniverseCanvas from '@/components/universe/UniverseCanvas';

vi.mock('@/components/universe/AmbientStars', () => ({
    default: () => <canvas aria-label="Ambient background stars" />,
}));

vi.mock('@/components/universe/ShootingStar', () => ({
    default: () => <canvas />,
}));

describe('UniverseCanvas', () => {
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
