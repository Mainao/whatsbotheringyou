'use client';

import useModalStore from '@/store/useModalStore';

import AddStarModal from '@/components/add-star/AddStarModal';
import PresenceCounter from '@/components/universe/PresenceCounter';
import UniverseCanvas from '@/components/universe/UniverseCanvas';

export default function Home() {
    const open = useModalStore((s) => s.open);

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden">
            <UniverseCanvas />

            {/* Add Star button — fixed top-left */}
            <button
                type="button"
                onClick={open}
                className="
        fixed top-4 left-4 z-20
        flex items-center gap-1.5
        px-[18px] py-[10px]
        rounded-full
        bg-bg-surface/80
        border border-brand/40
        text-text-primary text-sm font-medium
        backdrop-blur
        cursor-pointer
        hover:border-brand/80 hover:bg-bg-raised/85
    "
            >
                <span className="text-[11px] leading-none">✦</span>
                Add Star
            </button>

            <PresenceCounter count={0} />
            <AddStarModal />
        </main>
    );
}
