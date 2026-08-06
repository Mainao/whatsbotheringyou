'use client';

import { motion } from 'framer-motion';

import useModalStore from '@/store/useModalStore';

import { Button } from '@/components/ui/Button';

const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
};

export default function CrisisScreen() {
    const dismissCrisis: () => void = useModalStore((s) => s.dismissCrisis);

    return (
        <div className="fixed inset-0 z-50 bg-bg-base flex flex-col items-center justify-center px-6">
            <div className="max-w-md w-full flex flex-col items-center gap-12 text-center">
                {/* Section 1: Caring message */}
                <div className="flex flex-col gap-3">
                    <motion.p
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0 }}
                        className="text-2xl font-medium text-white/90 font-heading"
                    >
                        What you&apos;ve shared sounds really heavy.
                    </motion.p>
                    <motion.p
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.5 }}
                        className="text-lg text-white/60 whitespace-nowrap"
                    >
                        You deserve real support from someone who can truly help.
                    </motion.p>
                </div>

                {/* Section 2: Help link + reassurance */}
                <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 1.5 }}
                    className="flex flex-col gap-2 items-center"
                >
                    <a
                        href="https://findahelpline.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-amber-300/70 underline decoration-amber-300/30 underline-offset-4 hover:text-amber-200 hover:decoration-amber-200/50 transition-colors"
                    >
                        Talk to someone who can help
                    </a>
                    <p className="text-xs text-white/30">
                        Your message hasn&apos;t been shared. This is just between us.
                    </p>
                </motion.div>

                {/* Section 3: Return link */}
                <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 2 }}
                >
                    <Button
                        type="button"
                        variant="primary"
                        onClick={dismissCrisis}
                        className="capitalize bg-gradient-to-br from-neon-pink to-brand hover:from-neon-pink/90 hover:to-brand/90"
                    >
                        return to the universe
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
