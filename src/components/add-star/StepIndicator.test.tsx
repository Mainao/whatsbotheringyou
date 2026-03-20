import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StepIndicator from '@/components/add-star/StepIndicator';

// Expected DOM structure:
// container.firstElementChild (flex wrapper)
//   [0] dot  [1] line  [2] dot  [3] line  [4] dot
function getDots(container: HTMLElement): [HTMLElement, HTMLElement, HTMLElement] {
    const wrapper = container.firstElementChild;
    if (!wrapper) throw new Error('StepIndicator wrapper not found');
    if (wrapper.children.length < 5)
        throw new Error(
            `StepIndicator wrapper must have 5 children, got ${wrapper.children.length}`,
        );
    return [
        wrapper.children[0] as HTMLElement,
        wrapper.children[2] as HTMLElement,
        wrapper.children[4] as HTMLElement,
    ];
}

// Expected DOM structure: same as above — lines are at indices 1 and 3.
function getLines(container: HTMLElement): [HTMLElement, HTMLElement] {
    const wrapper = container.firstElementChild;
    if (!wrapper) throw new Error('StepIndicator wrapper not found');
    if (wrapper.children.length < 5)
        throw new Error(
            `StepIndicator wrapper must have 5 children, got ${wrapper.children.length}`,
        );
    return [wrapper.children[1] as HTMLElement, wrapper.children[3] as HTMLElement];
}

describe('StepIndicator', () => {
    // --- rendering ---

    it('renders without crashing for step 1', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        expect(container).toBeInTheDocument();
    });

    it('renders without crashing for step 2', () => {
        const { container } = render(<StepIndicator currentStep={2} />);
        expect(container).toBeInTheDocument();
    });

    it('renders without crashing for step 3', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        expect(container).toBeInTheDocument();
    });

    it('renders 5 children: 3 dots alternating with 2 lines', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        expect(container.firstElementChild?.children).toHaveLength(5);
    });

    it('wrapper is a flex container', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        expect(container.firstElementChild).toHaveClass('flex', 'items-center', 'justify-center');
    });

    // --- step 1: active dot ---

    it('step 1: first dot has the active size class', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [dot1] = getDots(container);
        expect(dot1).toHaveClass('size-[10px]');
    });

    it('step 1: first dot has the brand background class', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [dot1] = getDots(container);
        expect(dot1).toHaveClass('bg-brand');
    });

    it('step 1: second and third dots have the inactive size class', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [, dot2, dot3] = getDots(container);
        expect(dot2).toHaveClass('size-2');
        expect(dot3).toHaveClass('size-2');
    });

    it('step 1: second and third dots have the muted border class', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [, dot2, dot3] = getDots(container);
        expect(dot2).toHaveClass('border-text-muted');
        expect(dot3).toHaveClass('border-text-muted');
    });

    it('step 1: second and third dots have transparent background', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [, dot2, dot3] = getDots(container);
        expect(dot2).toHaveClass('bg-transparent');
        expect(dot3).toHaveClass('bg-transparent');
    });

    // --- step 2: active dot ---

    it('step 2: second dot has the active size class', () => {
        const { container } = render(<StepIndicator currentStep={2} />);
        const [, dot2] = getDots(container);
        expect(dot2).toHaveClass('size-[10px]');
    });

    it('step 2: second dot has the brand background class', () => {
        const { container } = render(<StepIndicator currentStep={2} />);
        const [, dot2] = getDots(container);
        expect(dot2).toHaveClass('bg-brand');
    });

    it('step 2: first and third dots have the inactive size class', () => {
        const { container } = render(<StepIndicator currentStep={2} />);
        const [dot1, , dot3] = getDots(container);
        expect(dot1).toHaveClass('size-2');
        expect(dot3).toHaveClass('size-2');
    });

    it('step 2: first and third dots have the muted border class', () => {
        const { container } = render(<StepIndicator currentStep={2} />);
        const [dot1, , dot3] = getDots(container);
        expect(dot1).toHaveClass('border-text-muted');
        expect(dot3).toHaveClass('border-text-muted');
    });

    // --- step 3: active dot ---

    it('step 3: third dot has the active size class', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        const [, , dot3] = getDots(container);
        expect(dot3).toHaveClass('size-[10px]');
    });

    it('step 3: third dot has the brand background class', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        const [, , dot3] = getDots(container);
        expect(dot3).toHaveClass('bg-brand');
    });

    it('step 3: first and second dots have the inactive size class', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        const [dot1, dot2] = getDots(container);
        expect(dot1).toHaveClass('size-2');
        expect(dot2).toHaveClass('size-2');
    });

    it('step 3: first and second dots have the muted border class', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        const [dot1, dot2] = getDots(container);
        expect(dot1).toHaveClass('border-text-muted');
        expect(dot2).toHaveClass('border-text-muted');
    });

    // --- lines ---

    it('separator lines have the muted background class', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [line1, line2] = getLines(container);
        expect(line1).toHaveClass('bg-text-muted');
        expect(line2).toHaveClass('bg-text-muted');
    });

    it('separator lines have the correct width and height classes', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const [line1, line2] = getLines(container);
        expect(line1).toHaveClass('w-10', 'h-px');
        expect(line2).toHaveClass('w-10', 'h-px');
    });
});
