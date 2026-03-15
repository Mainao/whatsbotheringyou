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
    description: 'A galaxy of tiny worries, shared with the universe.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>{children}</body>
        </html>
    );
}
