import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'bg-base': '#0D1117',
                'bg-surface': '#161B27',
                'bg-raised': '#1E2435',
                brand: '#7C5CBF',
                'brand-light': '#9B8EC4',
                'neon-pink': '#E879A0',
                'neon-blue': '#79C4E8',
                'neon-teal': '#4EC9B0',
                'neon-gold': '#C9A84C',
                'neon-grey': '#9CA3C4',
                'text-primary': '#F4F0FF',
                'text-muted': '#888899',
            },
            fontFamily: {
                sans: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
            },
            animation: {
                'star-pulse': 'star-pulse 3s ease-in-out infinite',
                'shooting-star': 'shooting-star 1.2s ease-in forwards',
                'fade-in': 'fade-in 0.7s ease-out both',
            },
            keyframes: {
                'star-pulse': {
                    '0%, 100%': { opacity: '0.6' },
                    '50%': { opacity: '1' },
                },
                'shooting-star': {
                    '0%': { opacity: '0.8', transform: 'translateX(0) translateY(0)' },
                    '100%': { opacity: '0', transform: 'translateX(120px) translateY(120px)' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
