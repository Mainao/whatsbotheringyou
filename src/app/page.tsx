'use client';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Step1Draw from '@/components/add-star/Step1Draw';
import StepIndicator from '@/components/add-star/StepIndicator';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import PresenceCounter from '@/components/universe/PresenceCounter';
import UniverseCanvas from '@/components/universe/UniverseCanvas';

export default function Home() {
    const open = useModalStore((s) => s.open);
    const isOpen = useModalStore((s) => s.isOpen);
    const currentStep = useModalStore((s) => s.currentStep);
    const close = useModalStore((s) => s.close);
    const reset = useDrawingStore((s) => s.reset);

    const handleClose = () => {
        close();
        reset();
    };

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden">
            <UniverseCanvas />

            {/* Add Star button — fixed top-left */}
            <Button
                type="button"
                variant="secondary"
                onClick={open}
                className="fixed top-4 left-4 z-20 gap-1.5 px-[18px] py-[10px] bg-bg-surface/80 border-brand/40 backdrop-blur hover:border-brand/80 hover:bg-bg-raised/85"
            >
                <span className="text-[11px] leading-none">✦</span>
                Add Star
            </Button>

            <PresenceCounter count={0} />

            <Modal isOpen={isOpen} onClose={handleClose} labelId="add-star-title">
                <Button
                    type="button"
                    variant="icon"
                    aria-label="Close modal"
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
                >
                    ×
                </Button>

                <div className="mb-6">
                    <StepIndicator currentStep={currentStep} />
                </div>

                {currentStep === 1 && <Step1Draw />}
                {currentStep === 2 && (
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#888899',
                            padding: '40px 0',
                        }}
                    >
                        Step 2 coming soon
                    </div>
                )}
                {currentStep === 3 && (
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#888899',
                            padding: '40px 0',
                        }}
                    >
                        Step 3 coming soon
                    </div>
                )}
            </Modal>
        </main>
    );
}
