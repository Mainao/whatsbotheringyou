import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import PresenceCounter from '@/components/universe/PresenceCounter';

describe('PresenceCounter', () => {
    it('renders 0 stars in the galaxy when count is 0', () => {
        render(<PresenceCounter count={0} />);
        expect(screen.getByText('0 stars in the galaxy')).toBeInTheDocument();
    });

    it('renders 1 star in the galaxy when count is 1', () => {
        render(<PresenceCounter count={1} />);
        expect(screen.getByText('1 star in the galaxy')).toBeInTheDocument();
    });

    it('renders 5 stars in the galaxy when count is 5', () => {
        render(<PresenceCounter count={5} />);
        expect(screen.getByText('5 stars in the galaxy')).toBeInTheDocument();
    });

    it('renders 3,929 stars in the galaxy when count is 3929', () => {
        render(<PresenceCounter count={3929} />);
        expect(screen.getByText('3,929 stars in the galaxy')).toBeInTheDocument();
    });

    it('renders 0 stars in the galaxy when no count prop is provided', () => {
        render(<PresenceCounter />);
        expect(screen.getByText('0 stars in the galaxy')).toBeInTheDocument();
    });

    it('is visible on screen', () => {
        render(<PresenceCounter count={0} />);
        const text = screen.getByText('0 stars in the galaxy');
        expect(text).toBeVisible();
    });
});
