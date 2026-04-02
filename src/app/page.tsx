'use client';

import { Star, X } from 'lucide-react';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Step1Draw from '@/components/add-star/Step1Draw';
import Step2WriteText from '@/components/add-star/Step2WriteText';
import CrisisScreen from '@/components/crisis/CrisisScreen';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import PresenceCounter from '@/components/universe/PresenceCounter';
import UniverseCanvas from '@/components/universe/UniverseCanvas';

export default function Home() {
    const open = useModalStore((s) => s.open);
    const isOpen = useModalStore((s) => s.isOpen);
    const currentStep = useModalStore((s) => s.currentStep);
    const isCrisis = useModalStore((s) => s.isCrisis);
    const close = useModalStore((s) => s.close);
    const reset = useDrawingStore((s) => s.reset);

    const handleClose = () => {
        close();
        reset();
    };

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden">
            {isCrisis && <CrisisScreen />}
            <UniverseCanvas />

            <div className="fixed top-4 left-4 z-20">
                <p className="text-2xl font-semibold tracking-widest uppercase text-text-muted font-heading">
                    What&apos;s bothering you
                </p>
                <p className="text-sm text-text-muted/60 tracking-[0.21em] mt-0.5">
                    Release your worry to the universe
                </p>
            </div>

            {/* Add Star button — fixed top-right */}
            <Button
                type="button"
                variant="secondary"
                onClick={open}
                className="fixed top-4 right-4 z-20 gap-1.5 px-[18px] py-[10px] border-brand/40 backdrop-blur hover:border-brand/80 bg-gradient-to-br from-bg-surface/90 via-bg-raised/80 to-brand/20 hover:from-bg-surface hover:to-brand/30"
            >
                <Star size={14} />
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
                    <X size={24} />
                </Button>

                {currentStep === 1 && <Step1Draw />}
                {currentStep === 2 && <Step2WriteText />}
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
