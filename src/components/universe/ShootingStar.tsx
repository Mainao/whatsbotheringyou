'use client';

import { useEffect, useRef } from 'react';

import { ANIMATION } from '@/constants/animation';

interface ShootingStarData {
    startXRatio: number;
    startYRatio: number;
    angle: number; // radians, 20–70°
    length: number; // 80–120px
    duration: number; // ms, 1000–1400
    travelDistance: number; // px
}

export default function ShootingStar() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

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
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            if (activeStar) {
                const elapsed = timestamp - starStartTime;
                const progress = Math.min(elapsed / activeStar.duration, 1);
                const eased = progress * progress; // ease-in

                if (progress >= 1) {
                    activeStar = null;
                    scheduleNext();
                } else {
                    // Head moves forward, tail trails behind by `length` pixels
                    const startX = activeStar.startXRatio * window.innerWidth;
                    const startY = activeStar.startYRatio * window.innerHeight;
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
            const w = window.innerWidth;
            const h = window.innerHeight;

            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.width = w * currentDpr;
            canvas.height = h * currentDpr;

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
