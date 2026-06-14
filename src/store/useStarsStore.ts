import { create } from 'zustand';

import type { StarRecord } from '@/types/star';

interface StarsStore {
    stars: StarRecord[];
    selectedStarId: string | null;
    ownStarId: string | null;
    fetchStars: () => Promise<void>;
    fetchDrawings: () => Promise<void>;
    addStar: (star: StarRecord) => void;
    selectStar: (id: string) => void;
    clearSelectedStar: () => void;
    setOwnStar: (id: string) => void;
}

const useStarsStore = create<StarsStore>()((set) => ({
    stars: [],
    selectedStarId: null,
    ownStarId: null,
    fetchStars: async () => {
        try {
            const res = await fetch('/api/stars?drawings=false');
            if (!res.ok) return;
            const data = (await res.json()) as { stars: StarRecord[] };
            set({ stars: data.stars });
        } catch {
            // fail silently — universe renders without DB stars on network error
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
}));

export default useStarsStore;
