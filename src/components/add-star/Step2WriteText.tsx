'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { MoveRight, Shuffle } from 'lucide-react';

import { generateDisplayName } from '@/constants/displayName';

import { getStarWorldBase } from '@/lib/starPosition';
import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';
import usePanStore from '@/store/usePanStore';
import useStarsStore from '@/store/useStarsStore';

import { Button } from '@/components/ui/Button';

import type { StarRecord } from '@/types/star';

type SubmitResult = { ok: true; star: StarRecord } | { ok: false; message: string };

async function submitStar(
    worryText: string,
    displayName: string,
    starColor: string,
    blob: Blob | null,
): Promise<SubmitResult> {
    const formData = new FormData();
    formData.append('worryText', worryText);
    formData.append('displayName', displayName);
    formData.append('starColor', starColor);
    if (blob !== null) {
        formData.append('drawing', blob);
    }

    const response = await fetch('/api/stars', { method: 'POST', body: formData });

    if (!response.ok) {
        return { ok: false, message: 'Something went wrong — please try again.' };
    }

    const data = (await response.json()) as { star: StarRecord };
    return { ok: true, star: data.star };
}

const MAX_CHARS = 140;
const MAX_DISPLAY_NAME_CHARS = 40;

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
    const requestPan = usePanStore((s) => s.requestPan);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (!previewBlob) return;
        const url = URL.createObjectURL(previewBlob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [previewBlob]);

    useEffect(() => {
        setDisplayName(generateDisplayName());
    }, []);

    const handleShuffleDisplayName = () => {
        setDisplayName(generateDisplayName());
    };

    const handleSubmit = async () => {
        const trimmed = worryText.trim();
        const trimmedDisplayName = displayName.trim();

        if (trimmed.length === 0) {
            setValidationError(
                'What is bothering you? Share something to release it to the universe.',
            );
            return;
        }

        if (trimmedDisplayName.length === 0) {
            setValidationError('Give your star a name before releasing it.');
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        const finalizeSubmission = async () => {
            const result = await submitStar(
                trimmed,
                trimmedDisplayName,
                chosenColour,
                submissionBlob,
            );
            if (result.ok) {
                addStar(result.star);
                setOwnStar(result.star.id);
                // Resolve the spiral index from post-insert state using the same
                // createdAt sort UserStars applies, so the pan target is always correct.
                const sorted = [...useStarsStore.getState().stars].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                );
                const index = sorted.findIndex((s) => s.id === result.star.id);
                const { x: worldX, y: worldY } = getStarWorldBase(
                    index >= 0 ? index : sorted.length - 1,
                );
                requestPan(worldX, worldY, result.star.id);
                close();
                reset();
            } else {
                setValidationError(result.message);
            }
        };

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
                await finalizeSubmission();
            } else if (data.status === 'crisis') {
                triggerCrisis();
            } else {
                if (data.reason === 'harmful') {
                    setValidationError(
                        'This is a space for kindness. Please be gentle with your words 💫',
                    );
                } else if (data.reason === 'needs_more') {
                    setValidationError(
                        "We can feel that frustration — want to tell the universe what's actually behind it?",
                    );
                } else {
                    setValidationError(
                        "The universe is listening — try sharing what's actually bothering you.",
                    );
                }
            }
        } catch {
            await finalizeSubmission();
        } finally {
            setIsValidating(false);
            setWorryText('');
        }
    };

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
                <label htmlFor="display-name-input" className="mb-1 block text-xs text-text-muted">
                    Name your star
                </label>
                <div className="flex items-center gap-2">
                    <input
                        id="display-name-input"
                        type="text"
                        aria-label="Name your star"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        maxLength={MAX_DISPLAY_NAME_CHARS}
                        className="w-full rounded-lg bg-bg-raised border border-white/10 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60 transition-colors"
                    />
                    <Button
                        type="button"
                        variant="icon"
                        aria-label="Shuffle display name"
                        onClick={handleShuffleDisplayName}
                        className="shrink-0 border border-white/10"
                    >
                        <Shuffle size={14} />
                    </Button>
                </div>
            </div>

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
