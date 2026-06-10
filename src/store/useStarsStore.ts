import { create } from 'zustand';

import type { StarRecord } from '@/types/star';

interface StarsStore {
    stars: StarRecord[];
    fetchStars: () => Promise<void>;
    fetchDrawings: () => Promise<void>;
    addStar: (star: StarRecord) => void;
}

const useStarsStore = create<StarsStore>()((set) => ({
    stars: [],
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
}));

export default useStarsStore;
