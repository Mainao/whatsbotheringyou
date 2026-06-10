import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';

type StarMetadataRow = Prisma.StarGetPayload<{
    select: {
        id: true;
        message: true;
        starColor: true;
        replyCount: true;
        createdAt: true;
        expiresAt: true;
    };
}>;

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_STORE_MAX_ENTRIES = 5_000;
const MAX_STARS = 500;

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

export async function GET(request: Request): Promise<Response> {
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

    const url = new URL(request.url);
    const includeDrawings = url.searchParams.get('drawings') !== 'false';

    try {
        if (includeDrawings) {
            const stars = await prisma.star.findMany({
                where: { expiresAt: { gt: new Date() } },
                select: {
                    id: true,
                    message: true,
                    starColor: true,
                    drawingData: true,
                    replyCount: true,
                    createdAt: true,
                    expiresAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: MAX_STARS,
            });
            return Response.json({ stars });
        }

        const stars = await prisma.star.findMany({
            where: { expiresAt: { gt: new Date() } },
            select: {
                id: true,
                message: true,
                starColor: true,
                replyCount: true,
                createdAt: true,
                expiresAt: true,
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
