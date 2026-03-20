import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/components/add-star/StepIndicator', () => ({
    default: ({ currentStep }: { currentStep: 1 | 2 | 3 }) => (
        <div data-testid="mock-step-indicator" data-step={currentStep} />
    ),
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
        render(<Home />);
        await userEvent.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('modal renders a close button when open', async () => {
        render(<Home />);
        await userEvent.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    it('modal renders step indicator at step 1 when first opened', async () => {
        render(<Home />);
        await userEvent.click(screen.getByRole('button', { name: /add star/i }));
        const indicator = screen.getByTestId('mock-step-indicator');
        expect(indicator).toBeInTheDocument();
        expect(indicator).toHaveAttribute('data-step', '1');
    });

    it('modal renders Step 1 content when first opened', async () => {
        render(<Home />);
        await userEvent.click(screen.getByRole('button', { name: /add star/i }));
        expect(screen.getByTestId('mock-step1draw')).toBeInTheDocument();
    });

    it('clicking close button closes the modal', async () => {
        render(<Home />);
        await userEvent.click(screen.getByRole('button', { name: /add star/i }));
        await userEvent.click(screen.getByRole('button', { name: /close modal/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
