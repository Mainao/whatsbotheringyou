import { create } from 'zustand';

type Step = 1 | 2 | 3;

interface ModalStore {
    isOpen: boolean;
    currentStep: Step;
    open: () => void;
    close: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

const useModalStore = create<ModalStore>()((set) => ({
    isOpen: false,
    currentStep: 1,
    open: () => set({ isOpen: true, currentStep: 1 }),
    close: () => set({ isOpen: false }),
    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, 3) as Step,
        })),
    prevStep: () =>
        set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 1) as Step,
        })),
}));

export default useModalStore;
