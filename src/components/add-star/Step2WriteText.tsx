'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { MoveRight } from 'lucide-react';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import { Button } from '@/components/ui/Button';

const MAX_CHARS = 140;

export default function Step2WriteText() {
    const nextStep = useModalStore((s) => s.nextStep);
    const worryText = useDrawingStore((s) => s.worryText);
    const setWorryText = useDrawingStore((s) => s.setWorryText);
    const canvasBlob = useDrawingStore((s) => s.previewBlob);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasBlob) return;
        const url = URL.createObjectURL(canvasBlob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [canvasBlob]);

    const typed = worryText.length;

    return (
        <div className="flex flex-col flex-1 w-full">
            <h2 className="mt-4 mb-2 text-lg font-medium text-center text-text-primary font-heading">
                Tell the universe what&apos;s bothering you?
            </h2>

            {previewUrl !== null && (
                <div className="flex justify-center mt-4 mb-5">
                    <Image
                        src={previewUrl}
                        alt="Your star drawing"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                </div>
            )}

            <div className="mt-4">
                <textarea
                    aria-label="What's bothering you"
                    maxLength={MAX_CHARS}
                    value={worryText}
                    onChange={(e) => setWorryText(e.target.value)}
                    placeholder="Type…"
                    rows={4}
                    className="w-full resize-none rounded-lg bg-bg-raised border border-white/10 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/60 transition-colors"
                />
                <p className="mt-1 text-right text-xs text-text-muted">
                    {typed} / {MAX_CHARS}
                </p>
            </div>

            <div className="flex w-full justify-end mt-auto pt-8">
                <Button
                    type="button"
                    variant="primary"
                    className="min-w-[110px] bg-gradient-to-br from-neon-pink to-brand hover:from-neon-pink/90 hover:to-brand/90"
                    onClick={nextStep}
                >
                    Continue
                    <MoveRight size={14} />
                </Button>
            </div>
        </div>
    );
}
