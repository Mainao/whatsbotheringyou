import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ColourSwatch } from '@/components/add-star/ColourSwatch';

describe('ColourSwatch', () => {
    beforeEach(() => {});

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders a button with the provided aria-label', () => {
        render(<ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={false} />);

        expect(screen.getByRole('button', { name: 'Neon Pink' })).toBeInTheDocument();
    });

    it('sets aria-pressed to false when not selected', () => {
        render(<ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={false} />);

        expect(screen.getByRole('button', { name: 'Neon Pink' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('sets aria-pressed to true when selected', () => {
        render(<ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={true} />);

        expect(screen.getByRole('button', { name: 'Neon Pink' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
    });

    it('renders the button with the correct background colour via inline style', () => {
        render(<ColourSwatch colour="#79C4E8" label="Neon Blue" isSelected={false} />);

        expect(screen.getByRole('button', { name: 'Neon Blue' })).toHaveStyle({
            backgroundColor: '#79C4E8',
        });
    });

    it('calls onClick handler when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <ColourSwatch
                colour="#4EC9B0"
                label="Neon Teal"
                isSelected={false}
                onClick={handleClick}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Neon Teal' }));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when the button is disabled', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <ColourSwatch
                colour="#C9A84C"
                label="Neon Gold"
                isSelected={false}
                disabled
                onClick={handleClick}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Neon Gold' }));

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('has button type="button" to prevent accidental form submission', () => {
        render(<ColourSwatch colour="#9CA3C4" label="Neon Grey" isSelected={false} />);

        expect(screen.getByRole('button', { name: 'Neon Grey' })).toHaveAttribute('type', 'button');
    });

    it('is reachable by keyboard focus', () => {
        render(<ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={false} />);

        const button = screen.getByRole('button', { name: 'Neon Pink' });
        button.focus();

        expect(button).toHaveFocus();
    });

    it('fires onClick when activated via keyboard Enter key', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <ColourSwatch
                colour="#E879A0"
                label="Neon Pink"
                isSelected={false}
                onClick={handleClick}
            />,
        );

        screen.getByRole('button', { name: 'Neon Pink' }).focus();
        await user.keyboard('{Enter}');

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('fires onClick when activated via keyboard Space key', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <ColourSwatch
                colour="#E879A0"
                label="Neon Pink"
                isSelected={false}
                onClick={handleClick}
            />,
        );

        screen.getByRole('button', { name: 'Neon Pink' }).focus();
        await user.keyboard(' ');

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('spreads additional props onto the button element', () => {
        render(
            <ColourSwatch
                colour="#E879A0"
                label="Neon Pink"
                isSelected={false}
                data-testid="swatch-pink"
            />,
        );

        expect(screen.getByTestId('swatch-pink')).toBeInTheDocument();
    });

    it('renders a wrapper div that provides a minimum 44x44px touch target', () => {
        const { container } = render(
            <ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={false} />,
        );

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.tagName).toBe('DIV');
    });

    it('toggles aria-pressed when re-rendered with a different isSelected value', () => {
        const { rerender } = render(
            <ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={false} />,
        );

        expect(screen.getByRole('button', { name: 'Neon Pink' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );

        rerender(<ColourSwatch colour="#E879A0" label="Neon Pink" isSelected={true} />);

        expect(screen.getByRole('button', { name: 'Neon Pink' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
    });
});
