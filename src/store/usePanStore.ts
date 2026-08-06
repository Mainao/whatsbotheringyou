import { create } from 'zustand';

interface PendingPan {
    worldX: number;
    worldY: number;
    starId: string;
}

interface PanStore {
    pendingPan: PendingPan | null;
    requestPan: (worldX: number, worldY: number, starId: string) => void;
    consumePan: () => void;
}

const usePanStore = create<PanStore>()((set) => ({
    pendingPan: null,
    requestPan: (worldX, worldY, starId) => set({ pendingPan: { worldX, worldY, starId } }),
    consumePan: () => set({ pendingPan: null }),
}));

export default usePanStore;
