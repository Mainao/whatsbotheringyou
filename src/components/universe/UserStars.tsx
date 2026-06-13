'use client';

import { useEffect, useRef } from 'react';

import useStarsStore from '@/store/useStarsStore';

import type { StarRecord } from '@/types/star';

interface CanvasStar {
    id: string;
    spiralAngle: number;
    spiralSqrtIndex: number;
    color: string;
    pulseDuration: number;
    phaseOffset: number;
    driftAmplitude: number;
    driftPeriodX: number;
    driftPeriodY: number;
    driftPhaseX: number;
    driftPhaseY: number;
    bitmap: ImageBitmap | null;
}

const STAR_SIZE = 48;
const ANIM_PHASE1_MS = 400;
const ANIM_PHASE2_MS = 200;
const ANIM_GLOW_MS = 600;
const ANIM_TOTAL_MS = ANIM_PHASE1_MS + ANIM_PHASE2_MS + ANIM_GLOW_MS;
// Golden angle in radians — ensures no two stars share the same angular sector,
// filling gaps evenly as the spiral grows.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

function easeIn(t: number): number {
    return t * t;
}

function starToCanvas(star: StarRecord, index: number): CanvasStar {
    const hex = star.id.replace(/-/g, '');
    const norm = (s: string) => parseInt(s, 16) / 0xffffffff;

    const a = norm(hex.slice(0, 8));
    const b = norm(hex.slice(8, 16));
    const c = norm(hex.slice(16, 24));
    const d = norm(hex.slice(24, 32));

    return {
        id: star.id,
        spiralAngle: index * GOLDEN_ANGLE,
        spiralSqrtIndex: Math.sqrt(index),
        color: star.starColor,
        pulseDuration: 3000 + c * 4000,
        phaseOffset: a * Math.PI * 2,
        driftAmplitude: 15 + c * 15,
        driftPeriodX: 20000 + d * 15000,
        driftPeriodY: 18000 + b * 17000,
        driftPhaseX: a * Math.PI * 2,
        driftPhaseY: b * Math.PI * 2 + Math.PI,
        bitmap: null,
    };
}

export default function UserStars() {
    const stars = useStarsStore((s) => s.stars);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<CanvasStar[]>([]);
    const bitmapCacheRef = useRef<Map<string, ImageBitmap>>(new Map());
    const prevStarIdsRef = useRef<Set<string>>(new Set());
    const newStarIdRef = useRef<string | null>(null);
    const fadeStartRef = useRef<number>(-1);

    useEffect(() => {
        // Oldest star → index 0 (center). Newest → highest index (outermost ring).
        const sorted = [...stars].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        starsRef.current = sorted.map((s, i) => starToCanvas(s, i));

        // Detect a single newly submitted star (skip on initial population).
        if (prevStarIdsRef.current.size > 0) {
            const newest = sorted[sorted.length - 1];
            if (newest !== undefined && !prevStarIdsRef.current.has(newest.id)) {
                newStarIdRef.current = newest.id;
                fadeStartRef.current = -1;
            }
        }
        prevStarIdsRef.current = new Set(sorted.map((s) => s.id));

        for (const [idx, star] of sorted.entries()) {
            if (star.drawingData === null) continue;

            const cs = starsRef.current[idx];
            if (cs === undefined) continue;

            const cached = bitmapCacheRef.current.get(star.id);
            if (cached !== undefined) {
                cs.bitmap = cached;
                continue;
            }

            const drawingData = star.drawingData;
            void (async () => {
                try {
                    const binary = atob(drawingData);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'image/png' });
                    const bitmap = await createImageBitmap(blob, {
                        resizeWidth: STAR_SIZE,
                        resizeHeight: STAR_SIZE,
                        resizeQuality: 'medium',
                    });
                    bitmapCacheRef.current.set(star.id, bitmap);
                    cs.bitmap = bitmap;
                } catch {
                    // corrupted drawing data — star stays as dot
                }
            })();
        }
    }, [stars]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cssWidth = window.innerWidth;
        let cssHeight = window.innerHeight;

        const setSize = () => {
            const dpr = window.devicePixelRatio ?? 1;
            cssWidth = window.innerWidth;
            cssHeight = window.innerHeight;
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            canvas.width = cssWidth * dpr;
            canvas.height = cssHeight * dpr;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            }
        };

        setSize();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rafId: number;
        let startTime = 0;

        const draw = (timestamp: number) => {
            if (startTime === 0) startTime = timestamp;
            const elapsed = timestamp - startTime;

            if (newStarIdRef.current !== null && fadeStartRef.current === -1) {
                fadeStartRef.current = timestamp;
            }

            ctx.clearRect(0, 0, cssWidth, cssHeight);

            // Scale spiral spacing to viewport — ~50px per ring on a 900px screen.
            const spacing = Math.min(cssWidth, cssHeight) * 0.055;

            for (const star of starsRef.current) {
                const t = elapsed % star.pulseDuration;
                const phase = (t / star.pulseDuration) * Math.PI * 2 + star.phaseOffset;
                const sinVal = (Math.sin(phase) + 1) / 2;
                const opacity = 0.45 + 0.3 * sinVal;

                const spiralRadius = spacing * star.spiralSqrtIndex;
                const baseX = cssWidth / 2 + spiralRadius * Math.cos(star.spiralAngle);
                const baseY = cssHeight / 2 + spiralRadius * Math.sin(star.spiralAngle);

                const xOffset =
                    star.driftAmplitude *
                    Math.sin((elapsed / star.driftPeriodX) * Math.PI * 2 + star.driftPhaseX);
                const yOffset =
                    star.driftAmplitude *
                    Math.sin((elapsed / star.driftPeriodY) * Math.PI * 2 + star.driftPhaseY);
                const x = baseX + xOffset;
                const y = baseY + yOffset;

                let fadeAlpha = 1;
                let scale = 1;
                let glowAlpha = 0;

                if (star.id === newStarIdRef.current) {
                    const t = timestamp - fadeStartRef.current;
                    if (t >= ANIM_TOTAL_MS) {
                        newStarIdRef.current = null;
                    } else {
                        if (t < ANIM_PHASE1_MS) {
                            const p = t / ANIM_PHASE1_MS;
                            fadeAlpha = easeOut(p);
                            scale = 0.3 + 0.9 * easeOut(p);
                        } else if (t < ANIM_PHASE1_MS + ANIM_PHASE2_MS) {
                            const p = (t - ANIM_PHASE1_MS) / ANIM_PHASE2_MS;
                            scale = 1.2 - 0.2 * easeIn(p);
                        }
                        const glowStart = ANIM_PHASE1_MS + ANIM_PHASE2_MS;
                        if (t >= glowStart) {
                            glowAlpha = 1 - (t - glowStart) / ANIM_GLOW_MS;
                        }
                    }
                }

                ctx.save();
                ctx.globalAlpha = opacity * fadeAlpha;

                // Translate to star position so scale pivots on the star centre.
                // For non-animated stars scale=1 and cx/cy equal x/y — no visual change.
                if (scale !== 1) {
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);
                }
                const cx = scale !== 1 ? 0 : x;
                const cy = scale !== 1 ? 0 : y;

                // Soft circular glow — radial gradient so the halo is always a circle,
                // independent of the drawn shape.
                const glowRadius = STAR_SIZE * 1.2;
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
                gradient.addColorStop(0, `${star.color}40`);
                gradient.addColorStop(1, `${star.color}00`);
                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                if (star.bitmap !== null) {
                    // 'screen' blend: dark canvas background becomes transparent,
                    // leaving only the drawn stroke visible against the universe.
                    ctx.globalCompositeOperation = 'screen';
                    const half = STAR_SIZE / 2;
                    ctx.drawImage(star.bitmap, cx - half, cy - half, STAR_SIZE, STAR_SIZE);
                } else {
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = star.color;
                    ctx.fill();
                }

                ctx.restore();

                // Landing glow — white radial burst drawn at true position after scale is gone.
                if (glowAlpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = glowAlpha * 0.7;
                    const landingRadius = STAR_SIZE * 3;
                    const landingGradient = ctx.createRadialGradient(x, y, 0, x, y, landingRadius);
                    landingGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
                    landingGradient.addColorStop(0.35, 'rgba(255,255,255,0.3)');
                    landingGradient.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.beginPath();
                    ctx.arc(x, y, landingRadius, 0, Math.PI * 2);
                    ctx.fillStyle = landingGradient;
                    ctx.fill();
                    ctx.restore();
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        window.addEventListener('resize', setSize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', setSize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-label="Stars shared by the community"
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1, touchAction: 'none' }}
        />
    );
}
