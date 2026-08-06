import { create } from 'zustand';

type Step = 1 | 2 | 3;

interface ModalStore {
    isOpen: boolean;
    currentStep: Step;
    isCrisis: boolean;
    open: () => void;
    close: () => void;
    nextStep: () => void;
    prevStep: () => void;
    triggerCrisis: () => void;
    dismissCrisis: () => void;
}

const useModalStore = create<ModalStore>()((set) => ({
    isOpen: false,
    currentStep: 1,
    isCrisis: false,
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
    triggerCrisis: () => set({ isCrisis: true, isOpen: false }),
    dismissCrisis: () => set({ isCrisis: false }),
}));

export default useModalStore;
