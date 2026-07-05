'use client';

import { useEffect, useRef } from 'react';

import { generateSectorStars, getVisibleSectorRange, sectorKey } from '@/lib/sectorStars';
import useCameraStore from '@/store/useCameraStore';

import type { SectorStar } from '@/lib/sectorStars';

// Sectors are unloaded once they fall this many sectors beyond the culling buffer.
const UNLOAD_MARGIN = 2;
const FADE_IN_MS = 1000;

export default function AmbientStars() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // On-demand sector cache — keyed by "sectorX,sectorY". Never persisted to state:
    // entries are computed when a sector enters the viewport and dropped when it leaves.
    const sectorCacheRef = useRef<Map<string, SectorStar[]>>(new Map());

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

        // Local handle to the stable sector cache — safe to reference in cleanup.
        const sectorCache = sectorCacheRef.current;

        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();

        let rafId: number;
        let fadeStartTime = 0;

        // Last-rendered camera + viewport — used to skip redraws when nothing changed.
        let lastPanX = Number.NaN;
        let lastPanY = Number.NaN;
        let lastZoom = Number.NaN;
        let lastWidth = 0;
        let lastHeight = 0;
        let needsRedraw = true;

        const getSector = (sx: number, sy: number): SectorStar[] => {
            const key = sectorKey(sx, sy);
            const cached = sectorCache.get(key);
            if (cached !== undefined) return cached;
            const generated = generateSectorStars(sx, sy);
            sectorCache.set(key, generated);
            return generated;
        };

        const draw = (timestamp: number) => {
            const { panX, panY, zoom } = useCameraStore.getState();

            const fadeAlpha =
                fadeStartTime === 0 ? 0 : Math.min(1, (timestamp - fadeStartTime) / FADE_IN_MS);
            const isFading = fadeAlpha < 1;

            const cameraChanged =
                panX !== lastPanX ||
                panY !== lastPanY ||
                zoom !== lastZoom ||
                cssWidth !== lastWidth ||
                cssHeight !== lastHeight;

            // Skip the frame entirely when the camera is still, the fade is done, and
            // no external redraw was requested — nothing on screen would change.
            if (!cameraChanged && !isFading && !needsRedraw) {
                rafId = requestAnimationFrame(draw);
                return;
            }

            lastPanX = panX;
            lastPanY = panY;
            lastZoom = zoom;
            lastWidth = cssWidth;
            lastHeight = cssHeight;
            needsRedraw = false;

            const range = getVisibleSectorRange(panX, panY, zoom, cssWidth, cssHeight, 1);

            // Drop sectors that have drifted well outside the viewport to bound memory.
            for (const key of sectorCache.keys()) {
                const comma = key.indexOf(',');
                const sx = Number(key.slice(0, comma));
                const sy = Number(key.slice(comma + 1));
                if (
                    sx < range.minSectorX - UNLOAD_MARGIN ||
                    sx > range.maxSectorX + UNLOAD_MARGIN ||
                    sy < range.minSectorY - UNLOAD_MARGIN ||
                    sy > range.maxSectorY + UNLOAD_MARGIN
                ) {
                    sectorCache.delete(key);
                }
            }

            ctx.clearRect(0, 0, cssWidth, cssHeight);
            ctx.globalAlpha = fadeAlpha;

            const halfW = cssWidth / 2;
            const halfH = cssHeight / 2;

            for (let sy = range.minSectorY; sy <= range.maxSectorY; sy++) {
                for (let sx = range.minSectorX; sx <= range.maxSectorX; sx++) {
                    const stars = getSector(sx, sy);
                    for (const star of stars) {
                        const screenX = halfW + (star.x - panX) * zoom;
                        const screenY = halfH + (star.y - panY) * zoom;

                        ctx.beginPath();
                        ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                        ctx.fill();
                    }
                }
            }

            ctx.globalAlpha = 1;
            rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);
        document.documentElement.dataset.canvasReady = '';
        fadeStartTime = performance.now();

        const handleResize = () => {
            setSize();
            setVh();
            needsRedraw = true;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
            sectorCache.clear();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-label="Ambient background stars"
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0, touchAction: 'none' }}
        />
    );
}
