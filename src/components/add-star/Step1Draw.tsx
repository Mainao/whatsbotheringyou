'use client';

import { useEffect, useRef, useState } from 'react';

import { Undo2, MoveRight } from 'lucide-react';

import { STAR_COLOURS } from '@/constants/colours';

import { cn } from '@/lib/cn';
import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import { ColourSwatch } from '@/components/add-star/ColourSwatch';
import DrawingCanvas from '@/components/add-star/DrawingCanvas';
import { Button } from '@/components/ui/Button';

import type { DrawingCanvasHandle } from '@/components/add-star/DrawingCanvas';

type MessageType = 'blank' | 'invalid' | '';

export default function Step1Draw() {
    const canvasRef = useRef<DrawingCanvasHandle>(null);
    const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isOpen = useModalStore((s) => s.isOpen);
    const nextStep = useModalStore((s) => s.nextStep);
    const setCanvasBlob = useDrawingStore((s) => s.setCanvasBlob);
    const setPreviewBlob = useDrawingStore((s) => s.setPreviewBlob);
    const chosenColour = useDrawingStore((s) => s.chosenColour);
    const setChosenColour = useDrawingStore((s) => s.setChosenColour);

    const [isCanvasBlank, setIsCanvasBlank] = useState(true);
    const [isValidating, setIsValidating] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('');

    useEffect(() => {
        return () => {
            if (messageTimerRef.current !== null) {
                clearTimeout(messageTimerRef.current);
                messageTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            canvasRef.current?.clearCanvas();
        }
    }, [isOpen]);

    const showMessage = (text: string, type: MessageType, durationMs: number) => {
        if (messageTimerRef.current !== null) clearTimeout(messageTimerRef.current);
        setValidationMessage(text);
        setMessageType(type);
        messageTimerRef.current = setTimeout(() => {
            setValidationMessage('');
            setMessageType('');
            messageTimerRef.current = null;
        }, durationMs);
    };

    const handleContinue = async () => {
        if (isCanvasBlank) {
            showMessage('Please draw something first', 'blank', 3000);
            return;
        }

        setIsValidating(true);
        let exportedBlob: Blob | null = null;

        try {
            const canvas = canvasRef.current;
            if (!canvas) {
                nextStep();
                return;
            }

            exportedBlob = await canvas.exportBlob();

            const formData = new FormData();
            formData.append('drawing', exportedBlob);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch('/api/validate-drawing', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const data = (await res.json()) as { valid: boolean; error?: string };

            if (data.valid) {
                setCanvasBlob(exportedBlob);
                const transparentBlob = await canvas.exportTransparentBlob();
                setPreviewBlob(transparentBlob);
                nextStep();
            } else if (data.error === 'api_error') {
                showMessage('Something went wrong — please try again.', 'invalid', 4000);
            } else {
                canvas.clearCanvas();
                showMessage("That doesn't look like a star — try again!", 'invalid', 3000);
            }
        } catch {
            showMessage('Something went wrong — please try again.', 'invalid', 4000);
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="mt-4 mb-5 text-lg font-medium text-center text-text-primary font-heading">
                Draw your star
            </h2>

            <DrawingCanvas ref={canvasRef} onBlankChange={setIsCanvasBlank} />

            <div className="mt-6 flex justify-center gap-2">
                {STAR_COLOURS.map((colour) => (
                    <ColourSwatch
                        key={colour.id}
                        colour={colour.hex}
                        label={colour.label}
                        isSelected={chosenColour === colour.hex}
                        onClick={() => {
                            setChosenColour(colour.hex);
                            canvasRef.current?.setColour(colour.hex);
                        }}
                    />
                ))}
            </div>

            <div
                aria-live="polite"
                className={cn(
                    'min-h-5 mt-2 text-center text-[13px] transition-opacity duration-300',
                    validationMessage ? 'opacity-100' : 'opacity-0',
                    messageType === 'invalid' ? 'text-white' : 'text-text-muted',
                )}
            >
                {validationMessage}
            </div>

            <div className="flex w-full justify-between items-center mt-6">
                <Button
                    type="button"
                    variant="ghost"
                    disabled={isCanvasBlank || isValidating}
                    onClick={() => {
                        canvasRef.current?.clearCanvas();
                    }}
                >
                    <Undo2 size={14} />
                    Undo
                </Button>

                <Button
                    type="button"
                    variant="primary"
                    isLoading={isValidating}
                    aria-label={isValidating ? 'Validating, please wait' : undefined}
                    className="min-w-[110px] bg-gradient-to-br from-neon-pink to-brand hover:from-neon-pink/90 hover:to-brand/90"
                    onClick={() => {
                        void handleContinue();
                    }}
                >
                    Continue
                    <MoveRight size={14} />
                </Button>
            </div>
        </div>
    );
}
