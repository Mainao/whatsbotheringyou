import { Fredoka, Quicksand } from 'next/font/google';

import type { Metadata } from 'next';
import './globals.css';

const quicksand = Quicksand({
    subsets: ['latin'],
    variable: '--font-quicksand',
    weight: ['400', '500', '600'],
    display: 'swap',
});

const fredoka = Fredoka({
    subsets: ['latin'],
    variable: '--font-fredoka',
    weight: ['400', '500', '600'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'WhatsBotheringYou',
    description: 'Tell the universe what is bothering you.',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${quicksand.variable} ${fredoka.variable} antialiased`}
                suppressHydrationWarning
            >
                {children}
            </body>
        </html>
    );
}
