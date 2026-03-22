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
    initGrid: (width: number, height: number) => void;
    isBlank: boolean;
    strokeCount: number;
    setColour: (hex: string) => void;
    setSize: (px: number) => void;
}

function hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = Number.parseInt(cleanHex.substring(0, 2), 16);
    const g = Number.parseInt(cleanHex.substring(2, 4), 16);
    const b = Number.parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function useDrawingCanvas(
    canvasRef: React.RefObject<HTMLCanvasElement>,
): DrawingCanvasHandle {
    const isDrawing = useRef(false);
    const didDrawInCurrentStroke = useRef(false);
    const undoStack = useRef<ImageData[]>([]);
    const activeColour = useRef('#E879A0');
    const activeSize = useRef(6);
    const points = useRef<{ x: number; y: number }[]>([]);
    const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isBlank, setIsBlank] = useState(true);
    const [strokeCount, setStrokeCount] = useState(0);

    const getCtx = (): CanvasRenderingContext2D | null => {
        return canvasRef.current?.getContext('2d') ?? null;
    };

    // Creates an offscreen grid canvas at the given dimensions and immediately
    // paints it onto the main canvas so the grid is visible after every resize.
    const initGrid = useCallback(
        (width: number, height: number): void => {
            if (width === 0 || height === 0) return;
            const gridCanvas = document.createElement('canvas');
            gridCanvas.width = width;
            gridCanvas.height = height;
            const gridCtx = gridCanvas.getContext('2d');
            if (!gridCtx) return;

            const CELL_SIZE = 20;
            gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            gridCtx.lineWidth = 0.5;

            for (let x = 0; x <= width; x += CELL_SIZE) {
                gridCtx.beginPath();
                gridCtx.moveTo(x, 0);
                gridCtx.lineTo(x, height);
                gridCtx.stroke();
            }

            for (let y = 0; y <= height; y += CELL_SIZE) {
                gridCtx.beginPath();
                gridCtx.moveTo(0, y);
                gridCtx.lineTo(width, y);
                gridCtx.stroke();
            }

            gridCanvasRef.current = gridCanvas;

            // Paint the grid onto the main canvas immediately.
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.drawImage(gridCanvas, 0, 0);
            }
        },
        [canvasRef],
    );

    // Restores the canvas to its last committed state. Uses a temp canvas so
    // putImageData never writes directly to the main canvas. Snapshots include
    // the grid layer, so when one exists the grid must not be drawn separately
    // (doing so would double-composite the grid, doubling its opacity).
    const restoreCanvas = (): void => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d') ?? null;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const snapshot = undoStack.current.at(-1);
        if (snapshot) {
            const temp = document.createElement('canvas');
            temp.width = canvas.width;
            temp.height = canvas.height;
            const tempCtx = temp.getContext('2d');
            if (tempCtx) {
                tempCtx.putImageData(snapshot, 0, 0);
                ctx.drawImage(temp, 0, 0);
            }
        } else {
            const grid = gridCanvasRef.current;
            if (grid && grid.width > 0 && grid.height > 0) {
                ctx.drawImage(grid, 0, 0);
            }
        }
    };

    const startStroke = (x: number, y: number): void => {
        const ctx = getCtx();
        if (!ctx) return;

        isDrawing.current = true;
        didDrawInCurrentStroke.current = false;
        points.current = [{ x, y }];
    };

    const continueStroke = (x: number, y: number): void => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        points.current.push({ x, y });

        // Restore committed strokes + grid before redrawing the current stroke.
        restoreCanvas();

        // Redraw the entire current stroke from all collected points.
        const pts = points.current;

        const layers = [
            {
                width: activeSize.current * 2.5,
                colour: hexToRgba(activeColour.current, 0.25),
                blur: 8,
                shadow: activeColour.current,
            },
            {
                width: activeSize.current * 1.2,
                colour: hexToRgba(activeColour.current, 1),
                blur: 0,
                shadow: 'transparent',
            },
            {
                width: activeSize.current * 0.25,
                colour: 'rgba(255, 255, 255, 0.9)',
                blur: 0,
                shadow: 'transparent',
            },
        ];

        layers.forEach((layer) => {
            const firstPt = pts[0];
            if (!firstPt) return;

            ctx.save();
            ctx.lineWidth = layer.width;
            ctx.strokeStyle = layer.colour;
            ctx.shadowBlur = layer.blur;
            ctx.shadowColor = layer.shadow;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(firstPt.x, firstPt.y);

            if (pts.length === 2) {
                const secondPt = pts[1];
                if (secondPt) {
                    ctx.lineTo(secondPt.x, secondPt.y);
                }
            } else if (pts.length > 2) {
                for (let i = 1; i < pts.length - 1; i++) {
                    const pt = pts[i];
                    const nextPt = pts[i + 1];
                    if (!pt || !nextPt) continue;
                    const midX = (pt.x + nextPt.x) / 2;
                    const midY = (pt.y + nextPt.y) / 2;
                    ctx.quadraticCurveTo(pt.x, pt.y, midX, midY);
                }
                const lastPt = pts.at(-1);
                if (lastPt) {
                    ctx.lineTo(lastPt.x, lastPt.y);
                }
            }

            ctx.stroke();
            ctx.restore();
        });

        didDrawInCurrentStroke.current = true;
    };

    const endStroke = (): void => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (!didDrawInCurrentStroke.current) return;

        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        points.current = [];

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
        restoreCanvas();

        setStrokeCount((prev) => {
            const next = Math.max(prev - 1, 0);
            setIsBlank(next === 0);
            return next;
        });
    };

    const cancelStroke = (): void => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        points.current = [];
        didDrawInCurrentStroke.current = false;
        restoreCanvas();
    };

    const clearUndoStack = useCallback((): void => {
        undoStack.current = [];
    }, []);

    const clearCanvas = (): void => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gridCanvasRef.current) {
            ctx.drawImage(gridCanvasRef.current, 0, 0);
        }
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

            const MAX_SIZE = 256;
            const QUALITY = 0.6;

            const scale = Math.min(MAX_SIZE / canvas.width, MAX_SIZE / canvas.height, 1);

            const width = Math.floor(canvas.width * scale);
            const height = Math.floor(canvas.height * scale);

            const offscreen = document.createElement('canvas');
            offscreen.width = width;
            offscreen.height = height;

            const ctx = offscreen.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to export canvas'));
                return;
            }

            ctx.fillStyle = '#0D1117';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(canvas, 0, 0, width, height);

            offscreen.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to export canvas'));
                    }
                },
                'image/jpeg',
                QUALITY,
            );
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
        initGrid,
        isBlank,
        strokeCount,
        setColour,
        setSize,
    };
}
