'use client';

import { useEffect, useRef } from 'react';

import { ANIMATION } from '@/constants/animation';

interface ShootingStarData {
    startXRatio: number;
    startYRatio: number;
    angle: number;
    length: number;
    duration: number;
    travelDistance: number;
}

export default function ShootingStar() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;

        let cssWidth = window.innerWidth;
        let cssHeight = window.innerHeight;

        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        let rafId: number;
        let timerId: ReturnType<typeof setTimeout> | null = null;
        let activeStar: ShootingStarData | null = null;
        let starStartTime = 0;

        const scheduleNext = (startup = false) => {
            const delay = startup
                ? Math.random() * 3000
                : ANIMATION.SHOOTING_STAR_MIN_INTERVAL_MS +
                  Math.random() *
                      (ANIMATION.SHOOTING_STAR_MAX_INTERVAL_MS -
                          ANIMATION.SHOOTING_STAR_MIN_INTERVAL_MS);
            timerId = setTimeout(() => {
                activeStar = {
                    startXRatio: Math.random(),
                    startYRatio: Math.random() * 0.6,
                    angle: (20 + Math.random() * 50) * (Math.PI / 180),
                    length: 80 + Math.random() * 40,
                    duration: ANIMATION.SHOOTING_STAR_DURATION_MS,
                    travelDistance: 250 + Math.random() * 150,
                };
                starStartTime = performance.now();
            }, delay);
        };

        const animate = (timestamp: number) => {
            ctx.clearRect(0, 0, cssWidth, cssHeight);

            if (activeStar) {
                const elapsed = timestamp - starStartTime;
                const progress = Math.min(elapsed / activeStar.duration, 1);
                const eased = progress * progress;

                if (progress >= 1) {
                    activeStar = null;
                    scheduleNext();
                } else {
                    const startX = activeStar.startXRatio * cssWidth;
                    const startY = activeStar.startYRatio * cssHeight;
                    const headX =
                        startX + Math.cos(activeStar.angle) * activeStar.travelDistance * eased;
                    const headY =
                        startY + Math.sin(activeStar.angle) * activeStar.travelDistance * eased;
                    const tailX = headX - Math.cos(activeStar.angle) * activeStar.length;
                    const tailY = headY - Math.sin(activeStar.angle) * activeStar.length;

                    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(headX, headY);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            rafId = requestAnimationFrame(animate);
        };

        scheduleNext(true);
        rafId = requestAnimationFrame(animate);

        const handleResize = () => {
            const currentDpr = window.devicePixelRatio ?? 1;
            cssWidth = window.innerWidth;
            cssHeight = window.innerHeight;

            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            canvas.width = cssWidth * currentDpr;
            canvas.height = cssHeight * currentDpr;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(currentDpr, currentDpr);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            if (timerId) clearTimeout(timerId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1, touchAction: 'none' }}
        />
    );
}
