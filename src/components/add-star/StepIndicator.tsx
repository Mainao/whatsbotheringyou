interface StepIndicatorProps {
    currentStep: 1 | 2 | 3;
}

function Dot({ active }: { active: boolean }) {
    return (
        <div
            className={
                active
                    ? 'size-[10px] shrink-0 rounded-full bg-brand'
                    : 'size-2 shrink-0 rounded-full border-[1.5px] border-text-muted bg-transparent'
            }
        />
    );
}

function Line() {
    return <div className="h-px w-10 shrink-0 bg-text-muted" />;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center">
            <Dot active={currentStep === 1} />
            <Line />
            <Dot active={currentStep === 2} />
            <Line />
            <Dot active={currentStep === 3} />
        </div>
    );
}
