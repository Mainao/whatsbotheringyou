export const SPIRAL_SPACING = 100;
// Golden angle in radians — ensures no two stars share the same angular sector,
// filling gaps evenly as the spiral grows.
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Base world position for a star at a given spiral index (no drift applied).
// Identical to the worldBaseX/worldBaseY calculation in UserStars draw loop.
export function getStarWorldBase(index: number): { x: number; y: number } {
    const spiralRadius = SPIRAL_SPACING * Math.sqrt(index);
    return {
        x: spiralRadius * Math.cos(index * GOLDEN_ANGLE),
        y: spiralRadius * Math.sin(index * GOLDEN_ANGLE),
    };
}
