'use client';

import { useEffect, useRef } from 'react';

import { ANIMATION } from '@/constants/animation';

interface Star {
    xRatio: number;
    yRatio: number;
    radius: number;
    baseOpacity: number;
    pulseDuration: number;
    phaseOffset: number;
}

function generateStars(count: number): Star[] {
    const stars: Star[] = [];
    let i = 0;

    while (i < count) {
        const groupSize = Math.floor(Math.random() * 3) + 3;
        const groupDuration = 3000 + Math.random() * 4000;
        const groupBasePhase = Math.random() * Math.PI * 2;

        for (let g = 0; g < groupSize && i < count; g++, i++) {
            stars.push({
                xRatio: Math.random(),
                yRatio: Math.random(),
                radius: 1 + Math.random(),
                baseOpacity: 0.08 + Math.random() * 0.37,
                pulseDuration: groupDuration + (Math.random() - 0.5) * 500,
                phaseOffset: groupBasePhase + (Math.random() - 0.5) * 0.3,
            });
        }
    }

    return stars;
}

export default function AmbientStars() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();

        const count =
            ANIMATION.AMBIENT_STAR_COUNT_MIN +
            Math.floor(
                Math.random() *
                    (ANIMATION.AMBIENT_STAR_COUNT_MAX - ANIMATION.AMBIENT_STAR_COUNT_MIN + 1),
            );

        const stars = generateStars(count);

        let rafId: number;
        let startTime = 0;

        const draw = (timestamp: number) => {
            if (startTime === 0) startTime = timestamp;
            const elapsed = timestamp - startTime;

            ctx.clearRect(0, 0, cssWidth, cssHeight);

            for (const star of stars) {
                const t = elapsed % star.pulseDuration;
                const phase = (t / star.pulseDuration) * Math.PI * 2 + star.phaseOffset;
                const sinVal = (Math.sin(phase) + 1) / 2;
                const opacity = star.baseOpacity + 0.25 * sinVal;

                ctx.beginPath();
                ctx.arc(
                    star.xRatio * cssWidth,
                    star.yRatio * cssHeight,
                    star.radius,
                    0,
                    Math.PI * 2,
                );
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fill();
            }

            rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        const handleResize = () => {
            setSize();
            setVh();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
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
