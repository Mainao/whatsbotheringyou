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

const DrawingCanvas = forwardRef<DrawingCanvasHandle, object>(function DrawingCanvas(_, ref) {
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
        <div
            style={{
                filter: 'drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 12px rgba(255,255,255,0.5))',
            }}
        >
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full rounded-xl block"
                    style={{
                        height: '260px',
                        background: '#0D1117',
                        border: '1px solid rgba(255,255,255,0.08)',
                        touchAction: 'none',
                        cursor: 'crosshair',
                    }}
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
                {isBlank && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#888899',
                            fontSize: '14px',
                            pointerEvents: 'none',
                        }}
                    >
                        Draw here...
                    </span>
                )}
            </div>
        </div>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
