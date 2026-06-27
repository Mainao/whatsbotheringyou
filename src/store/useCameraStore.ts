import { create } from 'zustand';

interface CameraState {
    panX: number;
    panY: number;
    zoom: number;
    setCamera: (panX: number, panY: number, zoom: number) => void;
}

const useCameraStore = create<CameraState>()((set) => ({
    panX: 0,
    panY: 0,
    zoom: 1,
    setCamera: (panX, panY, zoom) => set({ panX, panY, zoom }),
}));

export default useCameraStore;
