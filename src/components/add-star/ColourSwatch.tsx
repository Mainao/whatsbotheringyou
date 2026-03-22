'use client';

import { type ButtonHTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const colourSwatchVariants = cva(
    'h-8 w-8 cursor-pointer rounded-full transition-transform duration-150 hover:scale-110 sm:h-9 sm:w-9',
);

export interface ColourSwatchProps
    extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof colourSwatchVariants> {
    colour: string;
    label: string;
    isSelected: boolean;
}

export function ColourSwatch({
    colour,
    label,
    isSelected,
    className,
    ...props
}: ColourSwatchProps) {
    return (
        <div className="flex min-h-[44px] min-w-[44px] items-center justify-center">
            <button
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                className={cn(
                    colourSwatchVariants(),
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161B27]' : '',
                    className,
                )}
                style={{ backgroundColor: colour }}
                {...props}
            />
        </div>
    );
}
