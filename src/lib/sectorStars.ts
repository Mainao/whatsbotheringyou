export const SECTOR_SIZE = 1000;

const STAR_SIZES = [0.5, 1, 1.5, 2] as const;

export interface SectorStar {
    x: number;
    y: number;
    size: number;
    opacity: number;
}

export interface SectorRange {
    minSectorX: number;
    maxSectorX: number;
    minSectorY: number;
    maxSectorY: number;
}

export function sectorKey(sectorX: number, sectorY: number): string {
    return `${sectorX},${sectorY}`;
}

export function parseSectorKey(key: string): { sx: number; sy: number } {
    const comma = key.indexOf(',');
    return {
        sx: Number(key.slice(0, comma)),
        sy: Number(key.slice(comma + 1)),
    };
}

// 32-bit spatial hash — Math.imul keeps the multiply in int32 so the result is
// identical across engines, and >>> 0 yields an unsigned seed for the PRNG.
export function sectorSeed(sectorX: number, sectorY: number): number {
    return (Math.imul(sectorX, 73856093) ^ Math.imul(sectorY, 19349663)) >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG returning values in [0, 1).
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Deterministically generates the stars for a sector. The same (sectorX, sectorY)
// always yields identical stars — no state, purely computed from the coordinates.
export function generateSectorStars(sectorX: number, sectorY: number): SectorStar[] {
    const rand = mulberry32(sectorSeed(sectorX, sectorY));
    const count = 30 + Math.floor(rand() * 31);

    const originX = sectorX * SECTOR_SIZE;
    const originY = sectorY * SECTOR_SIZE;

    const stars: SectorStar[] = [];
    for (let i = 0; i < count; i++) {
        const localX = rand() * SECTOR_SIZE;
        const localY = rand() * SECTOR_SIZE;
        const size = STAR_SIZES[Math.floor(rand() * STAR_SIZES.length)] ?? 1;
        const opacity = 0.4 + rand() * 0.6;

        stars.push({
            x: originX + localX,
            y: originY + localY,
            size,
            opacity,
        });
    }

    return stars;
}

// Sectors intersecting the viewport, expanded by `buffer` sectors on each side to
// avoid pop-in. Screen→world uses the same camera transform as the renderer:
// screenX = width / 2 + (worldX - panX) * zoom.
export function getVisibleSectorRange(
    panX: number,
    panY: number,
    zoom: number,
    viewportWidth: number,
    viewportHeight: number,
    buffer = 1,
): SectorRange {
    const halfWorldW = viewportWidth / 2 / zoom;
    const halfWorldH = viewportHeight / 2 / zoom;

    const worldLeft = panX - halfWorldW;
    const worldRight = panX + halfWorldW;
    const worldTop = panY - halfWorldH;
    const worldBottom = panY + halfWorldH;

    return {
        minSectorX: Math.floor(worldLeft / SECTOR_SIZE) - buffer,
        maxSectorX: Math.floor(worldRight / SECTOR_SIZE) + buffer,
        minSectorY: Math.floor(worldTop / SECTOR_SIZE) - buffer,
        maxSectorY: Math.floor(worldBottom / SECTOR_SIZE) + buffer,
    };
}
