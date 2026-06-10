'use client';

import { useEffect, useRef } from 'react';

import useStarsStore from '@/store/useStarsStore';

import type { StarRecord } from '@/types/star';

interface CanvasStar {
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
// Golden angle in radians — ensures no two stars share the same angular sector,
// filling gaps evenly as the spiral grows.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function starToCanvas(star: StarRecord, index: number): CanvasStar {
    const hex = star.id.replace(/-/g, '');
    const norm = (s: string) => parseInt(s, 16) / 0xffffffff;

    const a = norm(hex.slice(0, 8));
    const b = norm(hex.slice(8, 16));
    const c = norm(hex.slice(16, 24));
    const d = norm(hex.slice(24, 32));

    return {
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

    useEffect(() => {
        // Oldest star → index 0 (center). Newest → highest index (outermost ring).
        const sorted = [...stars].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        starsRef.current = sorted.map((s, i) => starToCanvas(s, i));

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

                ctx.save();
                ctx.globalAlpha = opacity;

                // Soft circular glow — radial gradient so the halo is always a circle,
                // independent of the drawn shape.
                const glowRadius = STAR_SIZE * 1.2;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
                gradient.addColorStop(0, `${star.color}40`);
                gradient.addColorStop(1, `${star.color}00`);
                ctx.beginPath();
                ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                if (star.bitmap !== null) {
                    // 'screen' blend: dark canvas background becomes transparent,
                    // leaving only the drawn stroke visible against the universe.
                    ctx.globalCompositeOperation = 'screen';
                    const half = STAR_SIZE / 2;
                    ctx.drawImage(star.bitmap, x - half, y - half, STAR_SIZE, STAR_SIZE);
                } else {
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = star.color;
                    ctx.fill();
                }

                ctx.restore();
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
