import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Step2WriteText from '@/components/add-star/Step2WriteText';

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
    ),
}));

function mockFetch(data: { valid: boolean; reason: string }) {
    return vi.fn(() => Promise.resolve({ json: () => Promise.resolve(data) }));
}

describe('Step2WriteText', () => {
    let createObjectURLMock: ReturnType<typeof vi.fn>;
    let revokeObjectURLMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        useDrawingStore.getState().reset();
        useModalStore.setState({ isOpen: true, currentStep: 2 });

        createObjectURLMock = vi.fn(() => 'blob:mock-url');
        revokeObjectURLMock = vi.fn();

        vi.stubGlobal(
            'URL',
            Object.assign(URL, {
                createObjectURL: createObjectURLMock,
                revokeObjectURL: revokeObjectURLMock,
            }),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    // --- rendering ---

    it('renders the heading', () => {
        render(<Step2WriteText />);
        expect(
            screen.getByRole('heading', { name: /tell the universe what's bothering you/i }),
        ).toBeInTheDocument();
    });

    it('renders the textarea', () => {
        render(<Step2WriteText />);
        expect(screen.getByRole('textbox', { name: /what's bothering you/i })).toBeInTheDocument();
    });

    it('renders the Submit button', () => {
        render(<Step2WriteText />);
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders the character counter at 0 initially', () => {
        render(<Step2WriteText />);
        expect(screen.getByText('0 / 140')).toBeInTheDocument();
    });

    it('does not render the star preview image when there is no previewBlob', () => {
        render(<Step2WriteText />);
        expect(screen.queryByAltText('Your star drawing')).not.toBeInTheDocument();
    });

    it('renders the star preview image when previewBlob is set', () => {
        const blob = new Blob(['img'], { type: 'image/png' });
        useDrawingStore.getState().setPreviewBlob(blob);
        render(<Step2WriteText />);
        expect(screen.getByAltText('Your star drawing')).toBeInTheDocument();
    });

    it('renders the preview image with the object URL', () => {
        const blob = new Blob(['img'], { type: 'image/png' });
        useDrawingStore.getState().setPreviewBlob(blob);
        render(<Step2WriteText />);
        expect(screen.getByAltText('Your star drawing')).toHaveAttribute('src', 'blob:mock-url');
    });

    // --- textarea interaction ---

    it('textarea is empty initially', () => {
        render(<Step2WriteText />);
        expect(screen.getByRole('textbox', { name: /what's bothering you/i })).toHaveValue('');
    });

    it('typing updates the textarea value', async () => {
        const user = userEvent.setup();
        render(<Step2WriteText />);
        const textarea = screen.getByRole('textbox', { name: /what's bothering you/i });
        await user.type(textarea, 'hello');
        expect(textarea).toHaveValue('hello');
    });

    it('typing updates the character counter', async () => {
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.type(screen.getByRole('textbox', { name: /what's bothering you/i }), 'hello');
        expect(screen.getByText('5 / 140')).toBeInTheDocument();
    });

    it('typing saves the text to the drawing store', async () => {
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.type(screen.getByRole('textbox', { name: /what's bothering you/i }), 'hello');
        expect(useDrawingStore.getState().worryText).toBe('hello');
    });

    it('textarea reflects worryText already in the store', () => {
        useDrawingStore.getState().setWorryText('pre-filled');
        render(<Step2WriteText />);
        expect(screen.getByRole('textbox', { name: /what's bothering you/i })).toHaveValue(
            'pre-filled',
        );
    });

    it('character counter reflects worryText already in the store', () => {
        useDrawingStore.getState().setWorryText('hi');
        render(<Step2WriteText />);
        expect(screen.getByText('2 / 140')).toBeInTheDocument();
    });

    it('textarea enforces a maximum length of 140 characters', () => {
        render(<Step2WriteText />);
        expect(screen.getByRole('textbox', { name: /what's bothering you/i })).toHaveAttribute(
            'maxlength',
            '140',
        );
    });

    // --- submit: empty text skips validation ---

    it('advances to step 3 without calling the API when text is empty', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        expect(useModalStore.getState().currentStep).toBe(3);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('advances to step 3 without calling the API when text is whitespace only', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        useDrawingStore.getState().setWorryText('   ');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        expect(useModalStore.getState().currentStep).toBe(3);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // --- submit: validation ---

    it('calls the validate-text API with the worry text', async () => {
        const fetchMock = mockFetch({ valid: true, reason: 'ok' });
        vi.stubGlobal('fetch', fetchMock);
        useDrawingStore.getState().setWorryText('I am so anxious');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/validate-text',
                expect.objectContaining({ method: 'POST' }),
            ),
        );
    });

    it('advances to step 3 when validation returns valid', async () => {
        vi.stubGlobal('fetch', mockFetch({ valid: true, reason: 'ok' }));
        useDrawingStore.getState().setWorryText('I am so anxious');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        await waitFor(() => expect(useModalStore.getState().currentStep).toBe(3));
    });

    it('shows a user-friendly error message when validation returns invalid', async () => {
        vi.stubGlobal('fetch', mockFetch({ valid: false, reason: 'not a worry' }));
        useDrawingStore.getState().setWorryText('asdf lol');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        await waitFor(() =>
            expect(
                screen.getByText(/try sharing what's actually bothering you/i),
            ).toBeInTheDocument(),
        );
    });

    it('does not advance to step 3 when validation returns invalid', async () => {
        vi.stubGlobal('fetch', mockFetch({ valid: false, reason: 'not a worry' }));
        useDrawingStore.getState().setWorryText('asdf');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() =>
            expect(
                screen.getByText(/try sharing what's actually bothering you/i),
            ).toBeInTheDocument(),
        );
        expect(useModalStore.getState().currentStep).toBe(2);
    });

    it('advances to step 3 on network error (fail open)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network error'))),
        );
        useDrawingStore.getState().setWorryText('I feel so lost');
        const user = userEvent.setup();
        render(<Step2WriteText />);
        await user.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(useModalStore.getState().currentStep).toBe(3));
    });

    // --- object URL lifecycle ---

    it('calls URL.createObjectURL when previewBlob is set', () => {
        const blob = new Blob(['img'], { type: 'image/png' });
        useDrawingStore.getState().setPreviewBlob(blob);
        render(<Step2WriteText />);
        expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    });

    it('calls URL.revokeObjectURL on unmount when previewBlob is set', () => {
        const blob = new Blob(['img'], { type: 'image/png' });
        useDrawingStore.getState().setPreviewBlob(blob);
        const { unmount } = render(<Step2WriteText />);
        unmount();
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
});
