import { describe, it, expect } from 'vitest';

import { COLOURS, STAR_COLOURS } from '@/constants/colours';

describe('STAR_COLOURS', () => {
    it('has exactly 5 items', () => {
        expect(STAR_COLOURS).toHaveLength(5);
    });

    it('each item has id, hex, and label properties', () => {
        for (const colour of STAR_COLOURS) {
            expect(colour).toHaveProperty('id');
            expect(colour).toHaveProperty('hex');
            expect(colour).toHaveProperty('label');
        }
    });

    it('all hex values start with #', () => {
        for (const colour of STAR_COLOURS) {
            expect(colour.hex).toMatch(/^#/);
        }
    });

    it('all hex values are 7 characters long', () => {
        for (const colour of STAR_COLOURS) {
            expect(colour.hex).toHaveLength(7);
        }
    });

    it('has no duplicate hex values', () => {
        const hexValues = STAR_COLOURS.map((c) => c.hex);
        const uniqueHexValues = new Set(hexValues);
        expect(uniqueHexValues.size).toBe(hexValues.length);
    });

    it('has no duplicate ids', () => {
        const ids = STAR_COLOURS.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});

describe('COLOURS', () => {
    it('is defined', () => {
        expect(COLOURS).toBeDefined();
    });

    it('contains BG_BASE design token', () => {
        expect(COLOURS.BG_BASE).toBeDefined();
    });

    it('contains BRAND design token', () => {
        expect(COLOURS.BRAND).toBeDefined();
    });
});
