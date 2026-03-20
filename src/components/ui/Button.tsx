'use client';

import { type ButtonHTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
    'text-sm font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed',
    {
        variants: {
            variant: {
                primary:
                    'bg-brand text-white rounded-full border-0 px-6 py-2.5 hover:brightness-110',
                secondary:
                    'bg-transparent text-text-primary border border-brand rounded-full px-6 py-2.5 hover:bg-brand/15',
                ghost: 'bg-transparent text-text-primary border-0 px-4 py-2.5 hover:opacity-70',
                icon: '!bg-transparent text-text-muted border-0 !p-2 rounded-lg hover:text-text-primary !min-h-0',
            },
            size: {
                sm: 'text-xs px-[14px] py-1.5',
                md: 'text-sm px-6 py-2.5',
                lg: 'text-base px-8 py-3',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

function Spinner() {
    return (
        <span
            style={{
                display: 'inline-block',
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
            }}
        />
    );
}

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = ({
    className,
    variant,
    size,
    isLoading,
    children,
    disabled,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={(disabled ?? false) || (isLoading ?? false)}
            {...props}
        >
            {isLoading ? <Spinner /> : children}
        </button>
    );
};

export { Button, buttonVariants };
export type { ButtonProps };
