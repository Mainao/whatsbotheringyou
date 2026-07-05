'use client';

import { useEffect, useRef } from 'react';

import { GOLDEN_ANGLE, SPIRAL_SPACING } from '@/lib/starPosition';
import useCameraStore from '@/store/useCameraStore';
import useModalStore from '@/store/useModalStore';
import usePanStore from '@/store/usePanStore';
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
const PAN_DURATION_MS = 800;
const DRAG_THRESHOLD = 8;
const INERTIA_FRICTION = 0.92;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const CULL_MARGIN = STAR_SIZE * 2;

function easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

function easeIn(t: number): number {
    return t * t;
}

function clampZoom(z: number): number {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
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
    const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

    interface PanAnim {
        active: boolean;
        startTime: number;
        startX: number;
        startY: number;
        targetX: number;
        targetY: number;
        starId: string;
    }
    const panAnimRef = useRef<PanAnim>({
        active: false,
        startTime: 0,
        startX: 0,
        startY: 0,
        targetX: 0,
        targetY: 0,
        starId: '',
    });

    // Camera state — local refs for 60fps draw loop; synced to store for cross-component reads
    const panXRef = useRef(0);
    const panYRef = useRef(0);
    const zoomRef = useRef(1);

    // Inertia
    const velXRef = useRef(0);
    const velYRef = useRef(0);
    const inertiaRafIdRef = useRef<number | null>(null);

    // Pointer tracking — keyed by pointerId
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pointerDownPosRef = useRef({ x: 0, y: 0 });
    const didDragRef = useRef(false);
    const prevPointerTimeRef = useRef(0);

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

        // Desktop starts more zoomed out to show more of the universe at once
        const initialZoom = window.innerWidth >= 640 ? 0.7 : 1.0;
        zoomRef.current = initialZoom;
        panXRef.current = 0;
        panYRef.current = 0;
        useCameraStore.getState().setCamera(0, 0, initialZoom);

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

            // Consume a directly-triggered fade (set by triggerFadeIn after submission).
            // Checked before the useEffect-based guard so the first frame is clean.
            const pendingId = useStarsStore.getState().pendingFadeInId;
            if (pendingId !== null) {
                newStarIdRef.current = pendingId;
                fadeStartRef.current = -1;
                useStarsStore.getState().consumeFadeIn();
            }

            if (newStarIdRef.current !== null && fadeStartRef.current === -1) {
                fadeStartRef.current = timestamp;
            }

            // Pick up a pan-to-star request (set by Step2WriteText after submission).
            const pendingPan = usePanStore.getState().pendingPan;
            if (pendingPan !== null) {
                if (inertiaRafIdRef.current !== null) {
                    cancelAnimationFrame(inertiaRafIdRef.current);
                    inertiaRafIdRef.current = null;
                }
                velXRef.current = 0;
                velYRef.current = 0;
                panAnimRef.current = {
                    active: true,
                    startTime: timestamp,
                    startX: panXRef.current,
                    startY: panYRef.current,
                    targetX: pendingPan.worldX,
                    targetY: pendingPan.worldY,
                    starId: pendingPan.starId,
                };
                usePanStore.getState().consumePan();
            }

            // Apply in-progress pan animation.
            if (panAnimRef.current.active) {
                const t = Math.min(1, (timestamp - panAnimRef.current.startTime) / PAN_DURATION_MS);
                const eased = 1 - (1 - t) * (1 - t);
                panXRef.current =
                    panAnimRef.current.startX +
                    (panAnimRef.current.targetX - panAnimRef.current.startX) * eased;
                panYRef.current =
                    panAnimRef.current.startY +
                    (panAnimRef.current.targetY - panAnimRef.current.startY) * eased;
                syncCamera();
                if (t >= 1) {
                    panAnimRef.current.active = false;
                    useStarsStore.getState().triggerFadeIn(panAnimRef.current.starId);
                }
            }

            ctx.clearRect(0, 0, cssWidth, cssHeight);

            const panX = panXRef.current;
            const panY = panYRef.current;
            const zoom = zoomRef.current;

            positionsRef.current.clear();

            for (const star of starsRef.current) {
                const t = elapsed % star.pulseDuration;
                const phase = (t / star.pulseDuration) * Math.PI * 2 + star.phaseOffset;
                const sinVal = (Math.sin(phase) + 1) / 2;
                const opacity = 0.45 + 0.3 * sinVal;

                // World-space position — origin is the universe centre
                const spiralRadius = SPIRAL_SPACING * star.spiralSqrtIndex;
                const worldBaseX = spiralRadius * Math.cos(star.spiralAngle);
                const worldBaseY = spiralRadius * Math.sin(star.spiralAngle);

                const driftX =
                    star.driftAmplitude *
                    Math.sin((elapsed / star.driftPeriodX) * Math.PI * 2 + star.driftPhaseX);
                const driftY =
                    star.driftAmplitude *
                    Math.sin((elapsed / star.driftPeriodY) * Math.PI * 2 + star.driftPhaseY);

                const worldX = worldBaseX + driftX;
                const worldY = worldBaseY + driftY;

                // Camera transform: world → screen
                const x = cssWidth / 2 + (worldX - panX) * zoom;
                const y = cssHeight / 2 + (worldY - panY) * zoom;

                // Store screen position for hit testing (all stars, even off-screen)
                positionsRef.current.set(star.id, { x, y });

                // Diagnostic: confirm animation triggers — placed before culling so it fires
                // even when the new star is off-screen. Remove after debugging.
                if (star.id === newStarIdRef.current && timestamp - fadeStartRef.current < 1) {
                    // eslint-disable-next-line no-console
                    console.log('[StarFade] Animation triggered', {
                        starId: star.id,
                        timestamp: Date.now(),
                    });
                }

                // Skip drawing stars outside the viewport (plus a small margin for glows)
                if (
                    x < -CULL_MARGIN ||
                    x > cssWidth + CULL_MARGIN ||
                    y < -CULL_MARGIN ||
                    y > cssHeight + CULL_MARGIN
                ) {
                    continue;
                }

                let fadeAlpha = 1;
                let scale = 1;
                let glowAlpha = 0;

                if (star.id === newStarIdRef.current) {
                    const animT = timestamp - fadeStartRef.current;
                    if (animT >= ANIM_TOTAL_MS) {
                        newStarIdRef.current = null;
                    } else {
                        if (animT < ANIM_PHASE1_MS) {
                            // Phase 1: fade in + scale up — glow grows alongside the star
                            const p = animT / ANIM_PHASE1_MS;
                            fadeAlpha = easeOut(p);
                            scale = 0.3 + 0.9 * easeOut(p);
                            glowAlpha = easeOut(p);
                        } else if (animT < ANIM_PHASE1_MS + ANIM_PHASE2_MS) {
                            // Phase 2: settle to 1× — glow holds at peak
                            const p = (animT - ANIM_PHASE1_MS) / ANIM_PHASE2_MS;
                            scale = 1.2 - 0.2 * easeIn(p);
                            glowAlpha = 1;
                        } else {
                            // Phase 3: star is settled, glow fades out
                            const glowElapsed = animT - ANIM_PHASE1_MS - ANIM_PHASE2_MS;
                            glowAlpha = Math.max(0, 1 - glowElapsed / ANIM_GLOW_MS);
                        }
                    }
                }

                ctx.save();
                // During scale-in phases the star bursts in at full brightness;
                // the glow covering the settling transition masks the opacity handoff.
                ctx.globalAlpha = scale !== 1 ? fadeAlpha : opacity * fadeAlpha;

                // Translate to star position so scale pivots on the star centre.
                if (scale !== 1) {
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);
                }
                const cx = scale !== 1 ? 0 : x;
                const cy = scale !== 1 ? 0 : y;

                // Soft circular glow
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

                // Landing glow — white radial burst, grows with the star in phase 1,
                // holds at peak in phase 2, then fades over 600 ms in phase 3.
                if (glowAlpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = glowAlpha;
                    const landingRadius = STAR_SIZE * 5;
                    const landingGradient = ctx.createRadialGradient(x, y, 0, x, y, landingRadius);
                    landingGradient.addColorStop(0, 'rgba(255,255,255,1)');
                    landingGradient.addColorStop(0.25, 'rgba(255,255,255,0.5)');
                    landingGradient.addColorStop(0.6, 'rgba(255,255,255,0.1)');
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

        const HIT_RADIUS = 24;

        const getHitStarId = (clientX: number, clientY: number): string | null => {
            const rect = canvas.getBoundingClientRect();
            const px = clientX - rect.left;
            const py = clientY - rect.top;
            for (const [id, pos] of positionsRef.current) {
                const dx = px - pos.x;
                const dy = py - pos.y;
                if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return id;
            }
            return null;
        };

        const syncCamera = () => {
            useCameraStore.getState().setCamera(panXRef.current, panYRef.current, zoomRef.current);
        };

        // --- Pointer event handlers (pan on both desktop and mobile) ---

        const handlePointerDown = (e: PointerEvent) => {
            canvas.setPointerCapture(e.pointerId);
            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (inertiaRafIdRef.current !== null) {
                cancelAnimationFrame(inertiaRafIdRef.current);
                inertiaRafIdRef.current = null;
            }

            panAnimRef.current.active = false;

            if (activePointersRef.current.size === 1) {
                pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
                didDragRef.current = false;
                prevPointerTimeRef.current = performance.now();
                velXRef.current = 0;
                velYRef.current = 0;
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            const prev = activePointersRef.current.get(e.pointerId);
            if (prev === undefined) return;

            if (activePointersRef.current.size === 1) {
                const dx = e.clientX - prev.x;
                const dy = e.clientY - prev.y;

                activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

                const now = performance.now();
                const dt = now - prevPointerTimeRef.current;
                if (dt > 0) {
                    velXRef.current = dx / dt;
                    velYRef.current = dy / dt;
                }
                prevPointerTimeRef.current = now;

                const totalDx = e.clientX - pointerDownPosRef.current.x;
                const totalDy = e.clientY - pointerDownPosRef.current.y;
                if (
                    !didDragRef.current &&
                    Math.sqrt(totalDx * totalDx + totalDy * totalDy) > DRAG_THRESHOLD
                ) {
                    didDragRef.current = true;
                }

                if (didDragRef.current) {
                    panXRef.current -= dx / zoomRef.current;
                    panYRef.current -= dy / zoomRef.current;
                    syncCamera();
                }
            } else if (activePointersRef.current.size === 2) {
                // Capture old positions before updating this pointer
                const oldArr = Array.from(activePointersRef.current.values());
                activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const newArr = Array.from(activePointersRef.current.values());

                const old1 = oldArr[0];
                const old2 = oldArr[1];
                const new1 = newArr[0];
                const new2 = newArr[1];
                if (
                    old1 === undefined ||
                    old2 === undefined ||
                    new1 === undefined ||
                    new2 === undefined
                )
                    return;

                const oldDist = Math.sqrt((old2.x - old1.x) ** 2 + (old2.y - old1.y) ** 2);
                if (oldDist === 0) return;

                const newDist = Math.sqrt((new2.x - new1.x) ** 2 + (new2.y - new1.y) ** 2);

                // Midpoints in screen space
                const oldMidX = (old1.x + old2.x) / 2;
                const oldMidY = (old1.y + old2.y) / 2;
                const newMidX = (new1.x + new2.x) / 2;
                const newMidY = (new1.y + new2.y) / 2;

                const newZoom = clampZoom(zoomRef.current * (newDist / oldDist));

                // Keep the world point under the old midpoint fixed at the new midpoint
                const worldMidX = (oldMidX - cssWidth / 2) / zoomRef.current + panXRef.current;
                const worldMidY = (oldMidY - cssHeight / 2) / zoomRef.current + panYRef.current;
                panXRef.current = worldMidX - (newMidX - cssWidth / 2) / newZoom;
                panYRef.current = worldMidY - (newMidY - cssHeight / 2) / newZoom;
                zoomRef.current = newZoom;
                didDragRef.current = true;

                syncCamera();
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            const wasSingle = activePointersRef.current.size === 1;
            activePointersRef.current.delete(e.pointerId);

            if (!wasSingle) return;

            if (!didDragRef.current) {
                // Tap — open star detail if a star was hit
                if (!useModalStore.getState().isOpen) {
                    const id = getHitStarId(e.clientX, e.clientY);
                    if (id !== null) useStarsStore.getState().selectStar(id);
                }
                return;
            }

            // Drag ended — apply momentum inertia until velocity decays
            let velX = velXRef.current * 16;
            let velY = velYRef.current * 16;

            // function declaration allows self-reference without forward-ref TypeScript error
            function applyInertia() {
                velX *= INERTIA_FRICTION;
                velY *= INERTIA_FRICTION;
                panXRef.current -= velX / zoomRef.current;
                panYRef.current -= velY / zoomRef.current;
                syncCamera();
                if (Math.abs(velX) > 0.3 || Math.abs(velY) > 0.3) {
                    inertiaRafIdRef.current = requestAnimationFrame(applyInertia);
                } else {
                    inertiaRafIdRef.current = null;
                }
            }

            inertiaRafIdRef.current = requestAnimationFrame(applyInertia);
        };

        const handlePointerCancel = () => {
            activePointersRef.current.clear();
            if (inertiaRafIdRef.current !== null) {
                cancelAnimationFrame(inertiaRafIdRef.current);
                inertiaRafIdRef.current = null;
            }
        };

        // --- Wheel zoom (desktop) ---

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = 1 - e.deltaY * 0.001;
            const newZoom = clampZoom(zoomRef.current * factor);

            // Zoom toward cursor position
            const rect = canvas.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const worldCursorX = (cursorX - cssWidth / 2) / zoomRef.current + panXRef.current;
            const worldCursorY = (cursorY - cssHeight / 2) / zoomRef.current + panYRef.current;
            panXRef.current = worldCursorX - (cursorX - cssWidth / 2) / newZoom;
            panYRef.current = worldCursorY - (cursorY - cssHeight / 2) / newZoom;
            zoomRef.current = newZoom;

            syncCamera();
        };

        // --- Cursor hover (desktop) ---

        const handleMouseMove = (e: MouseEvent) => {
            canvas.style.cursor =
                getHitStarId(e.clientX, e.clientY) !== null ? 'pointer' : 'default';
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointercancel', handlePointerCancel);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', setSize);

        return () => {
            cancelAnimationFrame(rafId);
            if (inertiaRafIdRef.current !== null) {
                cancelAnimationFrame(inertiaRafIdRef.current);
                inertiaRafIdRef.current = null;
            }
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointercancel', handlePointerCancel);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', setSize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-label="Stars shared by the community"
            className="absolute inset-0"
            style={{ zIndex: 1, touchAction: 'none' }}
        />
    );
}
