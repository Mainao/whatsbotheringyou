import { useCallback, useRef, useState } from 'react';

export interface DrawingCanvasHandle {
    startStroke: (x: number, y: number) => void;
    continueStroke: (x: number, y: number) => void;
    endStroke: () => void;
    cancelStroke: () => void;
    undo: () => void;
    exportBlob: () => Promise<Blob>;
    clearCanvas: () => void;
    clearUndoStack: () => void;
    isBlank: boolean;
    strokeCount: number;
    setColour: (hex: string) => void;
    setSize: (px: number) => void;
}

export default function useDrawingCanvas(
    canvasRef: React.RefObject<HTMLCanvasElement>,
): DrawingCanvasHandle {
    const isDrawing = useRef(false);
    const undoStack = useRef<ImageData[]>([]);
    const activeColour = useRef('#9CA3C4');
    const activeSize = useRef(6);

    const [isBlank, setIsBlank] = useState(true);
    const [strokeCount, setStrokeCount] = useState(0);

    const getCtx = (): CanvasRenderingContext2D | null => {
        return canvasRef.current?.getContext('2d') ?? null;
    };

    const startStroke = (x: number, y: number): void => {
        const ctx = getCtx();
        if (!ctx) return;

        isDrawing.current = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = activeColour.current;
        ctx.lineWidth = activeSize.current;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const continueStroke = (x: number, y: number): void => {
        if (!isDrawing.current) return;
        const ctx = getCtx();
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endStroke = (): void => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        isDrawing.current = false;

        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.current.push(snapshot);
        if (undoStack.current.length > 20) {
            undoStack.current.shift();
        }

        setStrokeCount((prev) => prev + 1);
        setIsBlank(false);
    };

    const undo = (): void => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        if (undoStack.current.length === 0) {
            clearCanvas();
            return;
        }

        undoStack.current.pop();

        const previous = undoStack.current[undoStack.current.length - 1];
        if (previous) {
            ctx.putImageData(previous, 0, 0);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        setStrokeCount((prev) => {
            const next = Math.max(prev - 1, 0);
            setIsBlank(next === 0);
            return next;
        });
    };

    const cancelStroke = (): void => {
        isDrawing.current = false;
    };

    const clearUndoStack = useCallback((): void => {
        undoStack.current = [];
    }, []);

    const clearCanvas = (): void => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        undoStack.current = [];
        setStrokeCount(0);
        setIsBlank(true);
    };

    const exportBlob = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                reject(new Error('Failed to export canvas'));
                return;
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to export canvas'));
                }
            }, 'image/png');
        });
    };

    const setColour = (hex: string): void => {
        activeColour.current = hex;
    };

    const setSize = (px: number): void => {
        activeSize.current = px;
    };

    return {
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
    };
}
