import { prisma } from '@/lib/prisma';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_STORE_MAX_ENTRIES = 5_000;
const MAX_FILE_SIZE = 1 * 1024 * 1024;
const STAR_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
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
        return { allowed: true, retryAfter: 0 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
        return { allowed: false, retryAfter };
    }

    rateLimitStore.set(ip, { count: entry.count + 1, windowStart: entry.windowStart });
    return { allowed: true, retryAfter: 0 };
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
                headers: { 'Retry-After': String(rateLimit.retryAfter) },
            },
        );
    }

    try {
        const formData = await request.formData();
        const worryText = formData.get('worryText');
        const starColor = formData.get('starColor');
        const drawing = formData.get('drawing');

        if (typeof worryText !== 'string' || worryText.trim().length === 0) {
            return Response.json({ error: 'worryText is required' }, { status: 400 });
        }

        if (worryText.length > 280) {
            return Response.json({ error: 'worryText too long' }, { status: 400 });
        }

        if (typeof starColor !== 'string' || starColor.trim().length === 0) {
            return Response.json({ error: 'starColor is required' }, { status: 400 });
        }

        const todayMidnightUTC = new Date();
        todayMidnightUTC.setUTCHours(0, 0, 0, 0);

        const existing = await prisma.star.findFirst({
            where: { authorId: ip, createdAt: { gte: todayMidnightUTC } },
            select: { id: true },
        });

        if (existing !== null) {
            return Response.json(
                {
                    error: 'already_submitted',
                    message: "You've already released your worry today. Come back tomorrow ✨",
                },
                { status: 429 },
            );
        }

        let drawingData: string | null = null;
        if (drawing instanceof Blob) {
            if (drawing.size > MAX_FILE_SIZE) {
                return Response.json({ error: 'drawing too large' }, { status: 400 });
            }
            const arrayBuffer = await drawing.arrayBuffer();
            drawingData = Buffer.from(arrayBuffer).toString('base64');
        }

        const expiresAt = new Date(Date.now() + STAR_TTL_MS);

        const star = await prisma.star.create({
            data: {
                message: worryText.trim(),
                authorId: ip,
                starColor: starColor.trim(),
                drawingData,
                expiresAt,
            },
        });

        return Response.json({ star }, { status: 201 });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[star/POST]', error instanceof Error ? error.message : String(error));
        return Response.json({ error: 'internal_error' }, { status: 500 });
    }
}
