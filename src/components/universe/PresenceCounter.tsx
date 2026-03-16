interface PresenceCounterProps {
    readonly count?: number;
}

export default function PresenceCounter({ count = 0 }: PresenceCounterProps) {
    const noun = count === 1 ? 'star' : 'stars';
    const formatted = count.toLocaleString('en-US');

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2" style={{ zIndex: 10 }}>
            <p className="m-0 text-[13px] font-normal text-text-muted">
                {formatted} {noun} in the galaxy
            </p>
        </div>
    );
}
