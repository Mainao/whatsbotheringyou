import { describe, expect, it } from 'vitest';

import { generateSectorStars, getVisibleSectorRange, sectorSeed, SECTOR_SIZE } from './sectorStars';

describe('sectorSeed', () => {
    it('is deterministic for a given sector', () => {
        expect(sectorSeed(3, 7)).toBe(sectorSeed(3, 7));
    });

    it('produces an unsigned 32-bit integer', () => {
        const seed = sectorSeed(-12, 34);
        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThanOrEqual(0xffffffff);
    });

    it('uses the specified XOR spatial hash', () => {
        expect(sectorSeed(2, 5)).toBe((Math.imul(2, 73856093) ^ Math.imul(5, 19349663)) >>> 0);
    });
});

describe('generateSectorStars', () => {
    it('returns identical stars for the same sector', () => {
        expect(generateSectorStars(4, -2)).toEqual(generateSectorStars(4, -2));
    });

    it('returns different stars for different sectors', () => {
        expect(generateSectorStars(0, 0)).not.toEqual(generateSectorStars(0, 1));
    });

    it('generates between 30 and 60 stars', () => {
        for (const [sx, sy] of [
            [0, 0],
            [10, -4],
            [-99, 42],
            [5, 5],
        ]) {
            const count = generateSectorStars(sx ?? 0, sy ?? 0).length;
            expect(count).toBeGreaterThanOrEqual(30);
            expect(count).toBeLessThanOrEqual(60);
        }
    });

    it('places every star within sector world bounds', () => {
        const sx = 3;
        const sy = -2;
        const originX = sx * SECTOR_SIZE;
        const originY = sy * SECTOR_SIZE;
        for (const star of generateSectorStars(sx, sy)) {
            expect(star.x).toBeGreaterThanOrEqual(originX);
            expect(star.x).toBeLessThan(originX + SECTOR_SIZE);
            expect(star.y).toBeGreaterThanOrEqual(originY);
            expect(star.y).toBeLessThan(originY + SECTOR_SIZE);
        }
    });

    it('only uses the allowed discrete sizes', () => {
        for (const star of generateSectorStars(7, 7)) {
            expect([0.5, 1, 1.5, 2]).toContain(star.size);
        }
    });

    it('keeps opacity within 0.4 and 1.0', () => {
        for (const star of generateSectorStars(-5, 8)) {
            expect(star.opacity).toBeGreaterThanOrEqual(0.4);
            expect(star.opacity).toBeLessThanOrEqual(1.0);
        }
    });
});

describe('getVisibleSectorRange', () => {
    it('centres a single sector at the origin for a small viewport', () => {
        const range = getVisibleSectorRange(0, 0, 1, 800, 600, 0);
        expect(range.minSectorX).toBe(-1);
        expect(range.maxSectorX).toBe(0);
        expect(range.minSectorY).toBe(-1);
        expect(range.maxSectorY).toBe(0);
    });

    it('adds a one-sector buffer on every side by default', () => {
        const noBuffer = getVisibleSectorRange(0, 0, 1, 800, 600, 0);
        const buffered = getVisibleSectorRange(0, 0, 1, 800, 600);
        expect(buffered.minSectorX).toBe(noBuffer.minSectorX - 1);
        expect(buffered.maxSectorX).toBe(noBuffer.maxSectorX + 1);
        expect(buffered.minSectorY).toBe(noBuffer.minSectorY - 1);
        expect(buffered.maxSectorY).toBe(noBuffer.maxSectorY + 1);
    });

    it('reveals more sectors as zoom decreases', () => {
        const zoomedIn = getVisibleSectorRange(0, 0, 2, 1000, 1000, 0);
        const zoomedOut = getVisibleSectorRange(0, 0, 0.5, 1000, 1000, 0);
        const widthIn = zoomedIn.maxSectorX - zoomedIn.minSectorX;
        const widthOut = zoomedOut.maxSectorX - zoomedOut.minSectorX;
        expect(widthOut).toBeGreaterThan(widthIn);
    });
});
