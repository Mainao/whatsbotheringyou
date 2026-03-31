import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/Button';

describe('Button', () => {
    // --- rendering ---

    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders a native button element', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button').tagName.toLowerCase()).toBe('button');
    });

    // --- variants ---

    it('applies primary variant classes by default', () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-brand');
        expect(btn.className).toContain('text-white');
        expect(btn.className).toContain('rounded-full');
    });

    it('applies secondary variant classes', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('border-brand');
        expect(btn.className).toContain('rounded-full');
    });

    it('applies ghost variant classes', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-transparent');
    });

    it('applies icon variant classes', () => {
        render(<Button variant="icon">✕</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('rounded-lg');
    });

    // --- sizes ---

    it('applies md size classes by default', () => {
        render(<Button>Medium</Button>);
        expect(screen.getByRole('button').className).toContain('text-sm');
    });

    it('applies sm size classes', () => {
        render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button').className).toContain('text-xs');
    });

    it('applies lg size classes', () => {
        render(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button').className).toContain('text-base');
    });

    // --- disabled ---

    it('is not disabled by default', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not fire onClick when disabled', async () => {
        const handler = vi.fn();
        render(
            <Button disabled onClick={handler}>
                Disabled
            </Button>,
        );
        await userEvent.click(screen.getByRole('button'));
        expect(handler).not.toHaveBeenCalled();
    });

    // --- isLoading ---

    it('is disabled when isLoading is true', () => {
        render(<Button isLoading>Save</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('hides children and shows spinner when isLoading', () => {
        render(<Button isLoading>Save</Button>);
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        // spinner is a <span> inside the button
        const btn = screen.getByRole('button');
        expect(btn.querySelector('span')).toBeInTheDocument();
    });

    it('shows children and no spinner when not loading', () => {
        render(<Button>Save</Button>);
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByRole('button').querySelector('span')).not.toBeInTheDocument();
    });

    it('does not fire onClick when isLoading', async () => {
        const handler = vi.fn();
        render(
            <Button isLoading onClick={handler}>
                Save
            </Button>,
        );
        await userEvent.click(screen.getByRole('button'));
        expect(handler).not.toHaveBeenCalled();
    });

    // --- onClick ---

    it('fires onClick when clicked', async () => {
        const handler = vi.fn();
        render(<Button onClick={handler}>Click me</Button>);
        await userEvent.click(screen.getByRole('button'));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // --- className override ---

    it('merges custom className onto the button', () => {
        render(<Button className="my-custom-class">Styled</Button>);
        expect(screen.getByRole('button').className).toContain('my-custom-class');
    });

    // --- HTML attribute passthrough ---

    it('forwards arbitrary HTML attributes', () => {
        render(<Button data-testid="my-btn">Attr</Button>);
        expect(screen.getByTestId('my-btn')).toBeInTheDocument();
    });

    it('forwards type attribute', () => {
        render(<Button type="submit">Submit</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
});
