import { describe, it, expect } from 'vitest';

import { ANIMATION } from '@/constants/animation';

describe('ANIMATION', () => {
    it('all values are positive numbers', () => {
        for (const value of Object.values(ANIMATION)) {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThan(0);
        }
    });

    it('SHOOTING_STAR_MIN_INTERVAL_MS is less than SHOOTING_STAR_MAX_INTERVAL_MS', () => {
        expect(ANIMATION.SHOOTING_STAR_MIN_INTERVAL_MS).toBeLessThan(
            ANIMATION.SHOOTING_STAR_MAX_INTERVAL_MS,
        );
    });

    it('SHOOTING_STAR_DURATION_MS is a positive number', () => {
        expect(ANIMATION.SHOOTING_STAR_DURATION_MS).toBeGreaterThan(0);
    });

    it('AMBIENT_STAR_COUNT_MIN is less than AMBIENT_STAR_COUNT_MAX', () => {
        expect(ANIMATION.AMBIENT_STAR_COUNT_MIN).toBeLessThan(ANIMATION.AMBIENT_STAR_COUNT_MAX);
    });

    it('STAR_DRIFT_AMPLITUDE_PX is a positive number', () => {
        expect(ANIMATION.STAR_DRIFT_AMPLITUDE_PX).toBeGreaterThan(0);
    });
});
