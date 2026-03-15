import { describe, it, expect } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
    it('returns a single class unchanged', () => {
        expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('merges multiple classes', () => {
        expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('excludes class when condition is false', () => {
        const isActive = false;
        expect(cn('text-red-500', isActive && 'bg-blue-500')).toBe('text-red-500');
    });

    it('includes class when condition is true', () => {
        const isActive = true;
        expect(cn('text-red-500', isActive && 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('resolves tailwind conflicts — last class wins', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles undefined and null gracefully', () => {
        expect(cn('text-red-500', undefined, null)).toBe('text-red-500');
    });

    it('returns empty string when no classes provided', () => {
        expect(cn()).toBe('');
    });
});
