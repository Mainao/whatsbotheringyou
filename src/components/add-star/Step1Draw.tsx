'use client';

import { useRef, useState } from 'react';

import useDrawingStore from '@/store/useDrawingStore';
import useModalStore from '@/store/useModalStore';

import DrawingCanvas from '@/components/add-star/DrawingCanvas';

import type { DrawingCanvasHandle } from '@/components/add-star/DrawingCanvas';

type MessageType = 'blank' | 'invalid' | '';

export default function Step1Draw() {
    const canvasRef = useRef<DrawingCanvasHandle>(null);
    const nextStep = useModalStore((s) => s.nextStep);
    const setCanvasBlob = useDrawingStore((s) => s.setCanvasBlob);

    const [isValidating, setIsValidating] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('');

    const showMessage = (text: string, type: MessageType, durationMs: number) => {
        setValidationMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setValidationMessage('');
            setMessageType('');
        }, durationMs);
    };

    const handleContinue = async () => {
        if (canvasRef.current?.isBlank) {
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

            const data = (await res.json()) as { valid: boolean };

            if (data.valid) {
                setCanvasBlob(exportedBlob);
                nextStep();
            } else {
                canvas.clearCanvas();
                showMessage("That doesn't look like a star — try again!", 'invalid', 3000);
            }
        } catch {
            // AbortError (8s timeout) and all other errors fail open per spec
            if (exportedBlob) setCanvasBlob(exportedBlob);
            nextStep();
        } finally {
            setIsValidating(false);
        }
    };

    const messageColour = messageType === 'invalid' ? '#E879A0' : '#888899';

    return (
        <div>
            <h2
                style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    textAlign: 'center',
                    color: '#F4F0FF',
                    marginTop: 0,
                    marginBottom: '20px',
                }}
            >
                Draw your star
            </h2>

            <DrawingCanvas ref={canvasRef} />

            <div
                aria-live="polite"
                style={{
                    minHeight: '20px',
                    marginTop: '8px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: messageColour,
                    opacity: validationMessage ? 1 : 0,
                    transition: 'opacity 0.3s',
                }}
            >
                {validationMessage}
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                }}
            >
                <button
                    onClick={() => {
                        void handleContinue();
                    }}
                    disabled={isValidating}
                    style={{
                        background: '#7C5CBF',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '10px 24px',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: isValidating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '110px',
                    }}
                >
                    {isValidating ? (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: 'white',
                                borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }}
                        />
                    ) : (
                        'Continue →'
                    )}
                </button>
            </div>
        </div>
    );
}
