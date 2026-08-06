import { cn } from '@/lib/cn';

interface SpinnerProps {
    size?: number;
    className?: string;
}

function Spinner({ size = 18, className }: SpinnerProps) {
    return (
        <span
            className={cn(
                'inline-block shrink-0 rounded-full border-2 border-white/30 border-t-white',
                className,
            )}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                animation: 'spin 0.7s linear infinite',
            }}
        />
    );
}

export { Spinner };
export type { SpinnerProps };
