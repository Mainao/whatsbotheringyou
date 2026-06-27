'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { MoveRight } from 'lucide-react';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';
import useStarsStore from '@/store/useStarsStore';

import { Button } from '@/components/ui/Button';

import type { StarRecord } from '@/types/star';

type SubmitResult =
    | { ok: true; star: StarRecord }
    | { ok: false; kind: 'already_submitted'; message: string }
    | { ok: false; kind: 'error'; message: string };

async function submitStar(
    worryText: string,
    starColor: string,
    blob: Blob | null,
): Promise<SubmitResult> {
    const formData = new FormData();
    formData.append('worryText', worryText);
    formData.append('starColor', starColor);
    if (blob !== null) {
        formData.append('drawing', blob);
    }

    const response = await fetch('/api/star', { method: 'POST', body: formData });

    if (response.status === 429) {
        const data = (await response.json()) as { error?: string; message?: string };
        if (data.error === 'already_submitted') {
            return {
                ok: false,
                kind: 'already_submitted',
                message:
                    data.message ??
                    "You've already released your worry today. Come back tomorrow ✨",
            };
        }
        return { ok: false, kind: 'error', message: 'Too many requests — please try again later.' };
    }

    if (!response.ok) {
        return { ok: false, kind: 'error', message: 'Something went wrong — please try again.' };
    }

    const data = (await response.json()) as { star: StarRecord };
    return { ok: true, star: data.star };
}

const MAX_CHARS = 140;

export default function Step2WriteText() {
    const worryText = useDrawingStore((s) => s.worryText);
    const setWorryText = useDrawingStore((s) => s.setWorryText);
    const submissionBlob = useDrawingStore((s) => s.canvasBlob);
    const previewBlob = useDrawingStore((s) => s.previewBlob);
    const chosenColour = useDrawingStore((s) => s.chosenColour);
    const reset = useDrawingStore((s) => s.reset);
    const triggerCrisis = useModalStore((s) => s.triggerCrisis);
    const isCrisis = useModalStore((s) => s.isCrisis);
    const close = useModalStore((s) => s.close);
    const addStar = useStarsStore((s) => s.addStar);
    const setOwnStar = useStarsStore((s) => s.setOwnStar);
    const triggerFadeIn = useStarsStore((s) => s.triggerFadeIn);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [dailyNotice, setDailyNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!previewBlob) return;
        const url = URL.createObjectURL(previewBlob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [previewBlob]);

    const handleSubmit = async () => {
        const trimmed = worryText.trim();

        if (trimmed.length === 0) {
            setValidationError(
                'What is bothering you? Share something to release it to the universe.',
            );
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        try {
            const response = await fetch('/api/validate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: trimmed }),
            });
            const data = (await response.json()) as {
                status: 'valid' | 'invalid' | 'crisis';
                reason: string;
            };

            if (data.status === 'valid') {
                const result = await submitStar(trimmed, chosenColour, submissionBlob);
                if (result.ok) {
                    addStar(result.star);
                    setOwnStar(result.star.id);
                    triggerFadeIn(result.star.id);
                    close();
                    reset();
                } else if (result.kind === 'already_submitted') {
                    setDailyNotice(result.message);
                } else {
                    setValidationError(result.message);
                }
            } else if (data.status === 'crisis') {
                triggerCrisis();
            } else {
                if (data.reason === 'harmful') {
                    setValidationError(
                        'This is a space for kindness. Please be gentle with your words 💫',
                    );
                } else if (data.reason === 'non-english') {
                    setValidationError(
                        'We currently support English only. Please share your worry in English 💫',
                    );
                } else {
                    setValidationError(
                        "The universe is listening — try sharing what's actually bothering you.",
                    );
                }
            }
        } catch {
            const result = await submitStar(trimmed, chosenColour, submissionBlob);
            if (result.ok) {
                addStar(result.star);
                setOwnStar(result.star.id);
                triggerFadeIn(result.star.id);
                close();
                reset();
            } else if (result.kind === 'already_submitted') {
                setDailyNotice(result.message);
            } else {
                setValidationError(result.message);
            }
        } finally {
            setIsValidating(false);
            setWorryText('');
        }
    };

    const typed = worryText.length;

    if (dailyNotice !== null) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center text-center gap-5 py-8">
                <span className="text-5xl">✨</span>
                <p className="text-text-primary text-sm leading-relaxed max-w-[260px]">
                    {dailyNotice}
                </p>
            </div>
        );
    }

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

            {validationError !== null && (
                <p aria-live="polite" className="mt-2 text-sm text-white">
                    {validationError}
                </p>
            )}

            {!isCrisis && (
                <div className="flex w-full justify-end mt-auto pt-8">
                    <Button
                        type="button"
                        variant="primary"
                        isLoading={isValidating}
                        className="capitalize min-w-[110px] bg-gradient-to-br from-neon-pink to-brand hover:from-neon-pink/90 hover:to-brand/90"
                        onClick={() => {
                            void handleSubmit();
                        }}
                    >
                        release your worry
                        <MoveRight size={14} />
                    </Button>
                </div>
            )}
        </div>
    );
}
