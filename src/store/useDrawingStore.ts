import { create } from 'zustand';

interface DrawingStore {
    canvasBlob: Blob | null;
    previewBlob: Blob | null;
    chosenColour: string;
    brushSize: number;
    worryText: string;
    setCanvasBlob: (blob: Blob | null) => void;
    setPreviewBlob: (blob: Blob | null) => void;
    setChosenColour: (colour: string) => void;
    setBrushSize: (size: number) => void;
    setWorryText: (text: string) => void;
    reset: () => void;
}

const DEFAULT_STATE = {
    canvasBlob: null,
    previewBlob: null,
    chosenColour: '#E879A0',
    brushSize: 6,
    worryText: '',
} as const;

const useDrawingStore = create<DrawingStore>()((set) => ({
    ...DEFAULT_STATE,
    setCanvasBlob: (blob) => set({ canvasBlob: blob }),
    setPreviewBlob: (blob) => set({ previewBlob: blob }),
    setChosenColour: (colour) => set({ chosenColour: colour }),
    setBrushSize: (size) => set({ brushSize: size }),
    setWorryText: (text) => set({ worryText: text }),
    reset: () => set(DEFAULT_STATE),
}));

export default useDrawingStore;
