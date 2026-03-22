import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Step1Draw from '@/components/add-star/Step1Draw';

// --- hoisted mock handles ---

const mocks = vi.hoisted(() => ({
    exportBlob: vi.fn(),
    clearCanvas: vi.fn(),
}));

let triggerBlankChange: ((isBlank: boolean) => void) | undefined;

vi.mock('@/components/add-star/DrawingCanvas', async () => {
    const { forwardRef, useImperativeHandle } = await import('react');

    type Handle = {
        isBlank: boolean;
        strokeCount: number;
        exportBlob: () => Promise<Blob>;
        clearCanvas: () => void;
        undo: () => void;
    };

    type Props = { onBlankChange?: (isBlank: boolean) => void };

    return {
        default: forwardRef<Handle, Props>(function MockDrawingCanvas({ onBlankChange }, ref) {
            triggerBlankChange = onBlankChange;
            useImperativeHandle(ref, () => ({
                isBlank: true,
                strokeCount: 0,
                exportBlob: mocks.exportBlob as () => Promise<Blob>,
                clearCanvas: mocks.clearCanvas as () => void,
                undo: vi.fn() as () => void,
            }));
            return <canvas data-testid="mock-drawing-canvas" />;
        }),
    };
});

const mockBlob = new Blob(['drawing'], { type: 'image/jpeg' });

describe('Step1Draw', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.resetAllMocks();
        triggerBlankChange = undefined;
        useModalStore.getState().close();
        useDrawingStore.getState().reset();

        mocks.exportBlob.mockResolvedValue(mockBlob);

        fetchMock = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ valid: true }),
        });
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // --- rendering ---

    it('renders the "Draw your star" heading', () => {
        render(<Step1Draw />);
        expect(screen.getByRole('heading', { name: /draw your star/i })).toBeInTheDocument();
    });

    it('renders the drawing canvas', () => {
        render(<Step1Draw />);
        expect(screen.getByTestId('mock-drawing-canvas')).toBeInTheDocument();
    });

    it('renders an Undo button', () => {
        render(<Step1Draw />);
        expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    });

    it('renders a Continue button', () => {
        render(<Step1Draw />);
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('has a polite aria-live validation region', () => {
        const { container } = render(<Step1Draw />);
        expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });

    // --- undo button state ---

    it('Undo button is disabled when canvas is blank', () => {
        render(<Step1Draw />);
        expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
    });

    it('Undo button is enabled after drawing on the canvas', () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled();
    });

    it('Undo button becomes disabled again when canvas is cleared', () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        act(() => {
            triggerBlankChange?.(true);
        });
        expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
    });

    it('clicking Undo calls clearCanvas', async () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /undo/i }));
        expect(mocks.clearCanvas).toHaveBeenCalledTimes(1);
    });

    // --- continue: blank canvas ---

    it('shows "Please draw something first" when Continue clicked on blank canvas', async () => {
        render(<Step1Draw />);
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        expect(screen.getByText(/please draw something first/i)).toBeInTheDocument();
    });

    it('does not call the API when canvas is blank', async () => {
        render(<Step1Draw />);
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not advance step when canvas is blank', async () => {
        render(<Step1Draw />);
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        expect(useModalStore.getState().currentStep).toBe(1);
    });

    // --- continue: valid drawing ---

    it('POSTs to /api/validate-drawing with the canvas blob', async () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/validate-drawing',
                expect.objectContaining({ method: 'POST' }),
            ),
        );
    });

    it('advances to step 2 on valid drawing', async () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(useModalStore.getState().currentStep).toBe(2));
    });

    it('saves the canvas blob to the drawing store on valid drawing', async () => {
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(useDrawingStore.getState().canvasBlob).toBe(mockBlob));
    });

    // --- continue: invalid drawing ---

    it('shows error message on invalid drawing', async () => {
        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({ valid: false }),
        });
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() =>
            expect(screen.getByText(/that doesn't look like a star/i)).toBeInTheDocument(),
        );
    });

    it('clears canvas on invalid drawing', async () => {
        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({ valid: false }),
        });
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(mocks.clearCanvas).toHaveBeenCalledTimes(1));
    });

    it('does not advance step on invalid drawing', async () => {
        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({ valid: false }),
        });
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() =>
            expect(screen.getByText(/that doesn't look like a star/i)).toBeInTheDocument(),
        );
        expect(useModalStore.getState().currentStep).toBe(1);
    });

    // --- error handling ---

    it('shows error message on fetch network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network error'));
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
    });

    it('does not advance step on fetch network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network error'));
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
        expect(useModalStore.getState().currentStep).toBe(1);
    });

    it('does not save blob to store on fetch network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network error'));
        render(<Step1Draw />);
        act(() => {
            triggerBlankChange?.(false);
        });
        await userEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
        expect(useDrawingStore.getState().canvasBlob).toBeNull();
    });
});
