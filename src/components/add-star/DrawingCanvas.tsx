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
        undo,
        exportBlob,
        clearCanvas,
        isBlank,
        strokeCount,
        setColour,
        setSize,
    } = useDrawingCanvas(canvasRef);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const syncSize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        syncSize();

        const ro = new ResizeObserver(syncSize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

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
                    e.preventDefault();
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    startStroke(touch.clientX - rect.left, touch.clientY - rect.top);
                }}
                onTouchMove={(e) => {
                    e.preventDefault();
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    continueStroke(touch.clientX - rect.left, touch.clientY - rect.top);
                }}
                onTouchEnd={endStroke}
            />
        </div>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
