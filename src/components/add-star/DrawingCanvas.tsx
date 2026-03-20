'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import useDrawingCanvas from '@/hooks/useDrawingCanvas';

export interface DrawingCanvasHandle {
    isBlank: boolean;
    strokeCount: number;
    exportBlob: () => Promise<Blob>;
    clearCanvas: () => void;
    undo: () => void;
}

interface DrawingCanvasProps {
    onBlankChange?: (isBlank: boolean) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
    { onBlankChange },
    ref,
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        startStroke,
        continueStroke,
        endStroke,
        cancelStroke,
        undo,
        exportBlob,
        clearCanvas,
        clearUndoStack,
        isBlank,
        strokeCount,
        setColour,
        setSize,
    } = useDrawingCanvas(canvasRef);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const syncSize = () => {
            const newW = canvas.offsetWidth;
            const newH = canvas.offsetHeight;
            if (canvas.width === newW && canvas.height === newH) return;

            if (canvas.width > 0 && canvas.height > 0) {
                const offscreen = document.createElement('canvas');
                offscreen.width = canvas.width;
                offscreen.height = canvas.height;
                offscreen.getContext('2d')?.drawImage(canvas, 0, 0);
                canvas.width = newW;
                canvas.height = newH;
                canvas.getContext('2d')?.drawImage(offscreen, 0, 0, newW, newH);
            } else {
                canvas.width = newW;
                canvas.height = newH;
            }

            clearUndoStack();
        };

        syncSize();

        const ro = new ResizeObserver(syncSize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [clearUndoStack]);

    useEffect(() => {
        onBlankChange?.(isBlank);
    }, [isBlank, onBlankChange]);

    useEffect(() => {
        setColour('#FFFFFF');
        setSize(6);
    }, [setColour, setSize]);

    useImperativeHandle(ref, () => ({
        isBlank,
        strokeCount,
        exportBlob,
        clearCanvas,
        undo,
    }));

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="block h-[260px] w-full cursor-crosshair touch-none rounded-xl bg-bg-base"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Drawing canvas — draw your star here"
                onMouseDown={(e) => startStroke(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
                onMouseMove={(e) => {
                    if (e.buttons === 1) {
                        continueStroke(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    }
                }}
                onMouseUp={endStroke}
                onMouseLeave={endStroke}
                onTouchStart={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    startStroke(touch.clientX - rect.left, touch.clientY - rect.top);
                }}
                onTouchMove={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    continueStroke(touch.clientX - rect.left, touch.clientY - rect.top);
                }}
                onTouchEnd={endStroke}
                onTouchCancel={cancelStroke}
            />
        </div>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
