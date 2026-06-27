'use client';

import { useEffect, useState } from 'react';

export default function ExploreHint() {
    const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

    useEffect(() => {
        const fadeTimer = setTimeout(() => setPhase('fading'), 2500);
        const goneTimer = setTimeout(() => setPhase('gone'), 3500);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(goneTimer);
        };
    }, []);

    if (phase === 'gone') return null;

    return (
        <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none select-none"
            style={{
                zIndex: 10,
                opacity: phase === 'fading' ? 0 : 1,
                transition: 'opacity 1s ease-out',
            }}
        >
            <p className="text-xs text-text-muted/60 tracking-widest">Drag to explore ✦</p>
        </div>
    );
}
