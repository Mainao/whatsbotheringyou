'use client';

import { useEffect, useRef } from 'react';

interface ShootingStarData {
    startX: number;
    startY: number;
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

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rafId: number;
        let timerId: ReturnType<typeof setTimeout> | null = null;
        let activeStar: ShootingStarData | null = null;
        let starStartTime = 0;

        const scheduleNext = () => {
            const delay = 45000 + Math.random() * 45000; // 45–90s
            timerId = setTimeout(() => {
                activeStar = {
                    startX: Math.random() * window.innerWidth,
                    startY: Math.random() * window.innerHeight * 0.6,
                    angle: (20 + Math.random() * 50) * (Math.PI / 180),
                    length: 80 + Math.random() * 40,
                    duration: 1000 + Math.random() * 400,
                    travelDistance: 250 + Math.random() * 150,
                };
                starStartTime = performance.now();
            }, delay);
        };

        const animate = (timestamp: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (activeStar) {
                const elapsed = timestamp - starStartTime;
                const progress = Math.min(elapsed / activeStar.duration, 1);
                const eased = progress * progress; // ease-in

                if (progress >= 1) {
                    activeStar = null;
                    scheduleNext();
                } else {
                    // Head moves forward, tail trails behind by `length` pixels
                    const headX =
                        activeStar.startX +
                        Math.cos(activeStar.angle) * activeStar.travelDistance * eased;
                    const headY =
                        activeStar.startY +
                        Math.sin(activeStar.angle) * activeStar.travelDistance * eased;
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

        scheduleNext();
        rafId = requestAnimationFrame(animate);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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
            style={{ zIndex: 1 }}
        />
    );
}
