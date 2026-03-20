import { render, screen, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLOSE_DURATION, Modal } from './Modal';

const labelId = 'modal-title';

let showModalMock: ReturnType<typeof vi.fn>;
let closeMock: ReturnType<typeof vi.fn>;

const renderModal = (isOpen: boolean, onClose = vi.fn()) =>
    render(
        <Modal isOpen={isOpen} onClose={onClose} labelId={labelId}>
            <h2 id={labelId}>Test modal</h2>
            <p>Modal content</p>
            <button>Action</button>
        </Modal>,
    );

describe('Modal', () => {
    beforeEach(() => {
        vi.useFakeTimers();

        showModalMock = vi.fn(function (this: HTMLDialogElement) {
            this.setAttribute('open', '');
        });
        closeMock = vi.fn(function (this: HTMLDialogElement) {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        });

        HTMLDialogElement.prototype.showModal = showModalMock;
        HTMLDialogElement.prototype.close = closeMock;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // --- rendering ---

    it('renders children', () => {
        renderModal(true);
        expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('calls showModal when isOpen is true', () => {
        renderModal(true);
        expect(showModalMock).toHaveBeenCalledOnce();
    });

    it('does not call showModal when isOpen is false', () => {
        renderModal(false);
        expect(showModalMock).not.toHaveBeenCalled();
    });

    it('sets aria-labelledby on the dialog', () => {
        renderModal(true);
        expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby', labelId);
    });

    it('applies default maxWidth of 440', () => {
        renderModal(true);
        expect(document.querySelector('dialog')).toHaveStyle({ maxWidth: '440px' });
    });

    it('applies custom maxWidth', () => {
        const { container } = render(
            <Modal isOpen={true} onClose={vi.fn()} labelId={labelId} maxWidth={600}>
                <p>content</p>
            </Modal>,
        );
        expect(container.querySelector('dialog')).toHaveStyle({ maxWidth: '600px' });
    });

    it('applies custom className', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} labelId={labelId} className="custom-class">
                <p>content</p>
            </Modal>,
        );
        expect(document.querySelector('dialog')).toHaveClass('custom-class');
    });

    // --- open / close state ---

    it('applies dialog-opening class when open', () => {
        renderModal(true);
        expect(document.querySelector('dialog')).toHaveClass('dialog-opening');
    });

    it('applies dialog-closing class during close animation', () => {
        const { rerender } = renderModal(true);
        rerender(
            <Modal isOpen={false} onClose={vi.fn()} labelId={labelId}>
                <p>content</p>
            </Modal>,
        );
        expect(document.querySelector('dialog')).toHaveClass('dialog-closing');
    });

    it('calls close after CLOSE_DURATION when isOpen becomes false', async () => {
        const { rerender } = renderModal(true);
        rerender(
            <Modal isOpen={false} onClose={vi.fn()} labelId={labelId}>
                <p>content</p>
            </Modal>,
        );
        await act(() => vi.advanceTimersByTime(CLOSE_DURATION));
        expect(closeMock).toHaveBeenCalled();
    });

    // --- onClose callback ---

    it('calls onClose when the native close event fires', () => {
        const onClose = vi.fn();
        renderModal(true, onClose);
        document.querySelector('dialog')?.dispatchEvent(new Event('close'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when clicking the backdrop (dialog element itself)', () => {
        const onClose = vi.fn();
        renderModal(true, onClose);
        const dialog = document.querySelector('dialog');
        if (dialog) {
            fireEvent.click(dialog);
        }
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when clicking inside the dialog content', () => {
        const onClose = vi.fn();
        renderModal(true, onClose);
        fireEvent.click(screen.getByText('Modal content'));
        expect(onClose).not.toHaveBeenCalled();
    });

    // --- cleanup ---

    it('closes the dialog on unmount', () => {
        const { unmount } = renderModal(true);
        unmount();
        expect(closeMock).toHaveBeenCalled();
    });
});
