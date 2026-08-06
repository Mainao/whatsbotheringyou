'use client';

import useStarsStore from '@/store/useStarsStore';

import { Spinner } from '@/components/ui/Spinner';

import type { StarsStore } from '@/store/useStarsStore';

export default function StarsLoading() {
    const isLoading = useStarsStore((s: StarsStore) => s.isLoading);

    if (!isLoading) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-3 pointer-events-none"
        >
            <Spinner size={28} className="border-text-primary/25 border-t-text-primary" />
            <p className="text-sm tracking-wide text-text-muted">Loading stars…</p>
        </div>
    );
}
