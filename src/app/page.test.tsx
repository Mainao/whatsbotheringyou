import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Home from './page';

vi.mock('@/components/universe/UniverseCanvas', () => ({
    default: () => <div data-testid="mock-universe-canvas" />,
}));

vi.mock('@/components/universe/PresenceCounter', () => ({
    default: ({ count = 0 }: { count?: number }) => (
        <p>
            {count.toLocaleString('en-US')} {count === 1 ? 'star' : 'stars'} in the galaxy
        </p>
    ),
}));

describe('Home page', () => {
    it('renders without crashing', () => {
        const { container } = render(<Home />);
        expect(container).toBeInTheDocument();
    });

    it('renders a main element', () => {
        render(<Home />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders the universe canvas', () => {
        render(<Home />);
        expect(screen.getByTestId('mock-universe-canvas')).toBeInTheDocument();
    });

    it('renders the Add Star button', () => {
        render(<Home />);
        expect(screen.getByRole('button', { name: /add star/i })).toBeInTheDocument();
    });

    it('Add Star button contains the correct label text', () => {
        render(<Home />);
        const button = screen.getByRole('button', { name: /add star/i });
        expect(button.textContent).toMatch(/Add Star/);
    });

    it('Add Star button is accessible as a button element', () => {
        render(<Home />);
        const button = screen.getByRole('button', { name: /add star/i });
        expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('renders the presence counter', () => {
        render(<Home />);
        expect(screen.getByText('0 stars in the galaxy')).toBeInTheDocument();
    });
});
