'use client';

import { AnimatePresence, motion } from 'framer-motion';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import Step1Draw from '@/components/add-star/Step1Draw';
import StepIndicator from '@/components/add-star/StepIndicator';

export default function AddStarModal() {
    const isOpen = useModalStore((s) => s.isOpen);
    const currentStep = useModalStore((s) => s.currentStep);
    const close = useModalStore((s) => s.close);
    const reset = useDrawingStore((s) => s.reset);

    const handleClose = () => {
        close();
        reset();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 z-30"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                    />

                    <div
                        className="fixed z-40"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 'calc(100% - 32px)',
                            maxWidth: '440px',
                        }}
                    >
                        <motion.div
                            style={{
                                background: '#161B27',
                                borderRadius: '16px',
                                padding: '32px 28px',
                            }}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                aria-label="Close modal"
                                onClick={handleClose}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    color: '#888899',
                                    lineHeight: 1,
                                    padding: '4px',
                                }}
                            >
                                ×
                            </button>

                            <div style={{ marginBottom: '24px' }}>
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
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
