'use client';

import { type DialogHTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

export const CLOSE_DURATION = 280;

interface ModalProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'onClose'> {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    labelId: string;
    maxWidth?: number;
    minHeight?: number;
    className?: string;
}

const Modal = ({
    isOpen,
    onClose,
    children,
    labelId,
    maxWidth = 440,
    minHeight = 520,
    className,
    ...props
}: ModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isClosing, setIsClosing] = useState(false);
    const programmaticCloseRef = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            setIsClosing(false);
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                programmaticCloseRef.current = true;
                dialog.close();
                setIsClosing(false);
            }, CLOSE_DURATION);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        return () => {
            if (dialog?.open) {
                programmaticCloseRef.current = true;
                dialog.close();
            }
        };
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        const handleClose = () => {
            if (programmaticCloseRef.current) {
                programmaticCloseRef.current = false;
                return;
            }
            onClose();
        };
        dialog?.addEventListener('close', handleClose);
        return () => dialog?.removeEventListener('close', handleClose);
    }, [onClose]);

    useEffect(() => {
        const dialog = dialogRef.current;
        const handleClick = (e: MouseEvent) => {
            if (e.target === dialog) onClose();
        };
        dialog?.addEventListener('click', handleClick);
        return () => dialog?.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={labelId}
            className={cn(
                'open:flex open:flex-col w-[calc(100%-32px)] rounded-2xl border-0 bg-bg-surface py-8 px-7 text-text-primary outline-none',
                isClosing ? 'dialog-closing' : 'dialog-opening',
                className,
            )}
            style={{ maxWidth, minHeight }}
            {...props}
        >
            {children}
        </dialog>
    );
};

export { Modal };
export type { ModalProps };
