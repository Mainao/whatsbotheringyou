'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import useStarsStore from '@/store/useStarsStore';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function StarDetail() {
    const selectedStarId = useStarsStore((s) => s.selectedStarId);
    const stars = useStarsStore((s) => s.stars);
    const clearSelectedStar = useStarsStore((s) => s.clearSelectedStar);

    const star = stars.find((s) => s.id === selectedStarId) ?? null;

    return (
        <Modal
            isOpen={selectedStarId !== null}
            onClose={clearSelectedStar}
            labelId="star-detail-title"
            maxWidth={320}
            minHeight={240}
        >
            <Button
                type="button"
                variant="icon"
                aria-label="Close"
                onClick={clearSelectedStar}
                className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
            >
                <X size={24} />
            </Button>

            {star !== null && (
                <div className="flex flex-col flex-1 items-center text-center pt-2">
                    {star.drawingData !== null ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <motion.img
                            src={`data:image/png;base64,${star.drawingData}`}
                            alt="Star drawing"
                            width={80}
                            height={80}
                            className="object-contain rounded-xl"
                            animate={{ y: [-6, 6] }}
                            transition={{
                                duration: 2.5,
                                ease: 'easeInOut',
                                repeat: Infinity,
                                repeatType: 'reverse',
                            }}
                        />
                    ) : (
                        <div
                            className="rounded-full"
                            style={{
                                width: 80,
                                height: 80,
                                background: `radial-gradient(circle, ${star.starColor}80 0%, ${star.starColor}00 70%)`,
                            }}
                        />
                    )}

                    <p
                        id="star-detail-title"
                        className="mt-6 text-base leading-relaxed text-text-primary"
                    >
                        {star.message}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">— {star.displayName}</p>
                </div>
            )}
        </Modal>
    );
}
