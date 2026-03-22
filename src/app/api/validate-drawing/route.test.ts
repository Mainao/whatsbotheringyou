import Anthropic from '@anthropic-ai/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// --- hoisted mock handles ---

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk');

// --- types ---

type RouteResponse = {
    valid: boolean;
    error?: string;
    reason?: string;
    detail?: string;
};

// --- helpers ---

function makeRequest(blob?: Blob | string | null): Request {
    const formData = new FormData();
    if (blob !== undefined && blob !== null) {
        if (typeof blob === 'string') {
            formData.set('drawing', blob);
        } else {
            formData.set('drawing', blob, 'drawing.jpg');
        }
    }
    // Return a minimal mock — jsdom's Request cannot parse multipart FormData bodies
    return {
        formData: () => Promise.resolve(formData),
    } as unknown as Request;
}

function makeBlob(sizeBytes = 100): Blob {
    return new Blob([new Uint8Array(sizeBytes)], { type: 'image/jpeg' });
}

function aiResponse(text: string): { content: { type: string; text: string }[] } {
    return { content: [{ type: 'text', text }] };
}

describe('POST /api/validate-drawing', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Anthropic).mockImplementation(
            () => ({ messages: { create: mocks.create } }) as unknown as Anthropic,
        );
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    // --- input validation ---

    it('returns { valid: false } when no drawing field is present', async () => {
        const res = await POST(makeRequest(null));
        const data = (await res.json()) as RouteResponse;
        expect(data).toEqual({ valid: false });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('returns { valid: false } when drawing is a string', async () => {
        const res = await POST(makeRequest('not-a-blob'));
        const data = (await res.json()) as RouteResponse;
        expect(data).toEqual({ valid: false });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('returns { valid: false, reason: "file too large" } when drawing exceeds 1 MB', async () => {
        const oversized = makeBlob(1 * 1024 * 1024 + 1);
        const res = await POST(makeRequest(oversized));
        const data = (await res.json()) as RouteResponse;
        expect(data).toEqual({ valid: false, reason: 'file too large' });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    // --- Claude YES / NO responses ---

    it('returns { valid: true } when Claude responds YES', async () => {
        mocks.create.mockResolvedValue(aiResponse('YES'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(true);
    });

    it('returns { valid: false } when Claude responds NO', async () => {
        mocks.create.mockResolvedValue(aiResponse('NO'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(false);
    });

    it('returns { valid: true } when Claude responds lowercase yes', async () => {
        mocks.create.mockResolvedValue(aiResponse('yes'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(true);
    });

    it('returns { valid: true } when Claude response contains YES within a sentence', async () => {
        mocks.create.mockResolvedValue(aiResponse('YES, it looks like a star.'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(true);
    });

    it('returns { valid: false } when content array is empty', async () => {
        mocks.create.mockResolvedValue({ content: [] });
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(false);
    });

    it('returns { valid: false } when first content block is not a text block', async () => {
        mocks.create.mockResolvedValue({
            content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
        });
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(false);
    });

    // --- SDK call parameters ---

    it('calls anthropic.messages.create with correct model and max_tokens', async () => {
        mocks.create.mockResolvedValue(aiResponse('YES'));
        await POST(makeRequest(makeBlob()));
        expect(mocks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 10,
            }),
        );
    });

    it('sends the image as base64 with media_type image/jpeg', async () => {
        mocks.create.mockResolvedValue(aiResponse('YES'));
        await POST(makeRequest(makeBlob()));
        expect(mocks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                messages: expect.arrayContaining([
                    expect.objectContaining({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        content: expect.arrayContaining([
                            expect.objectContaining({
                                type: 'image',
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                source: expect.objectContaining({
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                }),
                            }),
                        ]),
                    }),
                ]),
            }),
        );
    });

    // --- error handling ---

    it('returns { valid: false, error: "api_error" } when SDK throws', async () => {
        mocks.create.mockRejectedValue(new Error('SDK error'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(false);
        expect(data.error).toBe('api_error');
    });

    it('logs the error message to console.error when SDK throws', async () => {
        mocks.create.mockRejectedValue(new Error('SDK error'));
        await POST(makeRequest(makeBlob()));
        expect(consoleErrorSpy).toHaveBeenCalledWith('[validate-drawing]', 'SDK error');
    });

    it('includes detail field in development when SDK throws', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        mocks.create.mockRejectedValue(new Error('dev error'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.detail).toBe('dev error');
    });

    it('omits detail field in production when SDK throws', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        mocks.create.mockRejectedValue(new Error('prod error'));
        const res = await POST(makeRequest(makeBlob()));
        const data = (await res.json()) as RouteResponse;
        expect(data.detail).toBeUndefined();
    });

    it('returns { valid: true, error: "api_timeout" } on timeout', async () => {
        vi.useFakeTimers();
        mocks.create.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve(aiResponse('YES')), 10_000)),
        );
        const responsePromise = POST(makeRequest(makeBlob()));
        await vi.advanceTimersByTimeAsync(8001);
        const res = await responsePromise;
        const data = (await res.json()) as RouteResponse;
        expect(data.valid).toBe(true);
        expect(data.error).toBe('api_timeout');
        vi.useRealTimers();
    });
});
