import { Inter } from 'next/font/google';

import type { Metadata } from 'next';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    weight: ['400', '500'],
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
            <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
