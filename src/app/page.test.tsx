import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Home from './page';

import type { ReactNode } from 'react';

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

vi.mock('@/components/ui/Modal', () => ({
    Modal: ({
        isOpen,
        children,
    }: {
        isOpen: boolean;
        onClose: () => void;
        children: ReactNode;
        labelId?: string;
    }) => (isOpen ? <div role="dialog">{children}</div> : null),
}));

vi.mock('@/components/add-star/Step1Draw', () => ({
    default: () => <div data-testid="mock-step1draw" />,
}));

describe('Home page', () => {
    beforeEach(() => {
        useModalStore.getState().close();
    });

    // --- rendering ---

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

    // --- modal ---

    it('modal is not visible initially', () => {
        render(<Home />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('clicking Add Star opens the modal', async () => {
        const user = userEvent.setup();
        render(<Home />);
        await user.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('modal renders a close button when open', async () => {
        const user = userEvent.setup();
        render(<Home />);
        await user.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    it('modal renders Step 1 content when first opened', async () => {
        const user = userEvent.setup();
        render(<Home />);
        await user.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByTestId('mock-step1draw')).toBeInTheDocument();
    });

    it('clicking close button closes the modal', async () => {
        const user = userEvent.setup();
        render(<Home />);
        await user.click(screen.getByRole('button', { name: /add star/i }));
        await user.click(screen.getByRole('button', { name: /close modal/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // --- modal steps ---

    it('renders step 2 content when currentStep is 2', () => {
        useModalStore.setState({ isOpen: true, currentStep: 2 });
        render(<Home />);
        expect(screen.getByText(/step 2 coming soon/i)).toBeInTheDocument();
    });

    it('renders step 3 content when currentStep is 3', () => {
        useModalStore.setState({ isOpen: true, currentStep: 3 });
        render(<Home />);
        expect(screen.getByText(/step 3 coming soon/i)).toBeInTheDocument();
    });

    // --- drawing store reset ---

    it('resets drawing store when modal is closed via close button', async () => {
        const user = userEvent.setup();
        const state = useDrawingStore.getState() as { reset: () => void };
        const resetSpy = vi.spyOn(state, 'reset');
        render(<Home />);
        await user.click(screen.getByRole('button', { name: /add star/i }));
        await user.click(screen.getByRole('button', { name: /close modal/i }));
        expect(resetSpy).toHaveBeenCalledOnce();
    });
});
