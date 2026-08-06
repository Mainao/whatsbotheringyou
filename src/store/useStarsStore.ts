import { create } from 'zustand';

import type { StarRecord } from '@/types/star';

interface StarsStore {
    stars: StarRecord[];
    isLoading: boolean;
    selectedStarId: string | null;
    ownStarId: string | null;
    pendingFadeInId: string | null;
    fetchStars: () => Promise<void>;
    fetchDrawings: () => Promise<void>;
    addStar: (star: StarRecord) => void;
    selectStar: (id: string) => void;
    clearSelectedStar: () => void;
    setOwnStar: (id: string) => void;
    triggerFadeIn: (id: string) => void;
    consumeFadeIn: () => void;
}

let fetchStarsRequestId = 0;

const useStarsStore = create<StarsStore>()((set) => ({
    stars: [],
    isLoading: true,
    selectedStarId: null,
    ownStarId: null,
    pendingFadeInId: null,
    fetchStars: async () => {
        const requestId = ++fetchStarsRequestId;
        set({ isLoading: true });
        try {
            const res = await fetch('/api/stars?drawings=false');
            if (!res.ok) return;
            const data = (await res.json()) as { stars: StarRecord[] };
            set({ stars: data.stars });
        } catch {
            // fail silently — universe renders without DB stars on network error
        } finally {
            if (requestId === fetchStarsRequestId) {
                set({ isLoading: false });
            }
        }
    },
    fetchDrawings: async () => {
        try {
            const res = await fetch('/api/stars');
            if (!res.ok) return;
            const data = (await res.json()) as { stars: StarRecord[] };
            set({ stars: data.stars });
        } catch {
            // fail silently — stars stay as colored dots
        }
    },
    addStar: (star) => set((state) => ({ stars: [star, ...state.stars] })),
    selectStar: (id) => set({ selectedStarId: id }),
    clearSelectedStar: () => set({ selectedStarId: null }),
    setOwnStar: (id) => set({ ownStarId: id }),
    triggerFadeIn: (id) => set({ pendingFadeInId: id }),
    consumeFadeIn: () => set({ pendingFadeInId: null }),
}));

export default useStarsStore;
export type { StarsStore };
