interface StepIndicatorProps {
    readonly currentStep: 1 | 2 | 3;
}

function Dot({ active, label }: { active: boolean; label: string }) {
    return (
        <div
            role="img"
            aria-label={label}
            aria-current={active ? 'step' : undefined}
            className={
                active
                    ? 'size-[10px] shrink-0 rounded-full bg-brand'
                    : 'size-2 shrink-0 rounded-full border-[1.5px] border-text-muted bg-transparent'
            }
        />
    );
}

function Line() {
    return <div aria-hidden="true" className="h-px w-10 shrink-0 bg-text-muted" />;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div
            role="group"
            aria-label={`Step ${currentStep} of 3`}
            className="flex items-center justify-center"
        >
            <Dot active={currentStep === 1} label="Step 1" />
            <Line />
            <Dot active={currentStep === 2} label="Step 2" />
            <Line />
            <Dot active={currentStep === 3} label="Step 3" />
        </div>
    );
}
