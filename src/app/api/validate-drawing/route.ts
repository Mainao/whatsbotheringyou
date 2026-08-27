import { GoogleGenAI } from '@google/genai';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_STORE_MAX_ENTRIES = 5_000;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter: number } {
    const now = Date.now();

    if (rateLimitStore.size > RATE_LIMIT_STORE_MAX_ENTRIES) {
        for (const [key, entry] of rateLimitStore) {
            if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
                rateLimitStore.delete(key);
            }
        }
    }

    const entry = rateLimitStore.get(ip);

    if (entry === undefined || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    const newCount = entry.count + 1;
    rateLimitStore.set(ip, { count: newCount, windowStart: entry.windowStart });
    return { allowed: true, remaining: RATE_LIMIT_MAX - newCount, retryAfter: 0 };
}

export async function POST(request: Request): Promise<Response> {
    const ip =
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfter),
                    'X-RateLimit-Remaining': '0',
                },
            },
        );
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const formData = await request.formData();
        const drawing = formData.get('drawing');

        if (drawing === null || !(drawing instanceof Blob)) {
            return Response.json({ valid: false });
        }

        if (drawing.size > MAX_FILE_SIZE) {
            return Response.json({ valid: false, reason: 'file too large' });
        }

        const arrayBuffer = await drawing.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const aiCall = ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: base64 } },
                { text: 'Does this drawing look like a star? Reply with only YES or NO.' },
            ],
            config: { maxOutputTokens: 10 },
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
        );

        const result = await Promise.race([aiCall, timeout]);

        const text = result.text;
        if (text === undefined) {
            return Response.json({ valid: true, error: 'invalid_response' });
        }

        const valid = text.toUpperCase().includes('YES');
        return Response.json({ valid });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[validate-drawing]', error instanceof Error ? error.message : String(error));

        if (error instanceof Error && error.message === 'timeout') {
            return Response.json({ valid: true, error: 'api_timeout' });
        }

        return Response.json({ valid: false, error: 'api_error' });
    }
}
