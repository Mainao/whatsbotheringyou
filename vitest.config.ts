import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            exclude: [
                'node_modules/',
                '.next/',
                'src/app/api/**',
                '**/*.config.*',
                '**/*.d.ts',
                'src/test/**',
            ],
            thresholds: {
                lines: 30,
                functions: 30,
                branches: 30,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
