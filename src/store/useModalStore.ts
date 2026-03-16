import { create } from 'zustand';

interface ModalStore {
    isOpen: boolean;
    currentStep: 1 | 2 | 3;
    open: () => void;
    close: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

const useModalStore = create<ModalStore>()((set) => ({
    isOpen: false,
    currentStep: 1,
    open: () => set({ isOpen: true, currentStep: 1 }),
    close: () => set({ isOpen: false, currentStep: 1 }),
    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3,
        })),
    prevStep: () =>
        set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3,
        })),
}));

export default useModalStore;
