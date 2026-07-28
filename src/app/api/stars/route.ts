import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';

type StarMetadataRow = Prisma.StarGetPayload<{
    select: {
        id: true;
        message: true;
        displayName: true;
        starColor: true;
        replyCount: true;
        createdAt: true;
    };
}>;

const GET_RATE_LIMIT_MAX = 30;
const POST_RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_STORE_MAX_ENTRIES = 5_000;
const MAX_STARS = 500;
const MAX_FILE_SIZE = 1 * 1024 * 1024;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const getRateLimitStore = new Map<string, RateLimitEntry>();
const postRateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
    store: Map<string, RateLimitEntry>,
    ip: string,
    max: number,
): { allowed: boolean; retryAfter: number } {
    const now = Date.now();

    if (store.size > RATE_LIMIT_STORE_MAX_ENTRIES) {
        for (const [key, entry] of store) {
            if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
                store.delete(key);
            }
        }
    }

    const entry = store.get(ip);

    if (entry === undefined || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
        store.set(ip, { count: 1, windowStart: now });
        return { allowed: true, retryAfter: 0 };
    }

    if (entry.count >= max) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
        return { allowed: false, retryAfter };
    }

    store.set(ip, { count: entry.count + 1, windowStart: entry.windowStart });
    return { allowed: true, retryAfter: 0 };
}

export async function GET(request: Request): Promise<Response> {
    const ip =
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimit = checkRateLimit(getRateLimitStore, ip, GET_RATE_LIMIT_MAX);

    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': String(rateLimit.retryAfter) },
            },
        );
    }

    const url = new URL(request.url);
    const includeDrawings = url.searchParams.get('drawings') !== 'false';

    try {
        if (includeDrawings) {
            const stars = await prisma.star.findMany({
                select: {
                    id: true,
                    message: true,
                    displayName: true,
                    starColor: true,
                    drawingData: true,
                    replyCount: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: MAX_STARS,
            });
            return Response.json({ stars });
        }

        const stars = await prisma.star.findMany({
            select: {
                id: true,
                message: true,
                displayName: true,
                starColor: true,
                replyCount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: MAX_STARS,
        });
        return Response.json({
            stars: stars.map((s: StarMetadataRow) => ({
                ...s,
                drawingData: null as string | null,
            })),
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[stars/GET]', error instanceof Error ? error.message : String(error));
        return Response.json({ error: 'internal_error' }, { status: 500 });
    }
}

export async function POST(request: Request): Promise<Response> {
    const ip =
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimit = checkRateLimit(postRateLimitStore, ip, POST_RATE_LIMIT_MAX);

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
        const displayName = formData.get('displayName');
        const starColor = formData.get('starColor');
        const drawing = formData.get('drawing');

        if (typeof worryText !== 'string' || worryText.trim().length === 0) {
            return Response.json({ error: 'worryText is required' }, { status: 400 });
        }

        if (worryText.length > 280) {
            return Response.json({ error: 'worryText too long' }, { status: 400 });
        }

        if (typeof displayName !== 'string' || displayName.trim().length === 0) {
            return Response.json({ error: 'displayName is required' }, { status: 400 });
        }

        if (displayName.length > 40) {
            return Response.json({ error: 'displayName too long' }, { status: 400 });
        }

        if (typeof starColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(starColor.trim())) {
            return Response.json(
                { error: 'starColor must be a 6-digit hex color' },
                { status: 400 },
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

        const star = await prisma.star.create({
            data: {
                message: worryText.trim(),
                displayName: displayName.trim(),
                authorId: ip,
                starColor: starColor.trim(),
                drawingData,
            },
        });

        return Response.json({ star }, { status: 201 });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[stars/POST]', error instanceof Error ? error.message : String(error));
        return Response.json({ error: 'internal_error' }, { status: 500 });
    }
}
