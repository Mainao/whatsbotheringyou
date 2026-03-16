interface StepIndicatorProps {
    currentStep: 1 | 2 | 3;
}

function Dot({ active }: { active: boolean }) {
    return (
        <div
            style={
                active
                    ? {
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#7C5CBF',
                          flexShrink: 0,
                      }
                    : {
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          border: '1.5px solid #888899',
                          background: 'transparent',
                          flexShrink: 0,
                      }
            }
        />
    );
}

function Line() {
    return <div style={{ width: '40px', height: '1px', background: '#888899', flexShrink: 0 }} />;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dot active={currentStep === 1} />
            <Line />
            <Dot active={currentStep === 2} />
            <Line />
            <Dot active={currentStep === 3} />
        </div>
    );
}
