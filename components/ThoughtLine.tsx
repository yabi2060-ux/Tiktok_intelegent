import { useElapsed, usePrefersReducedMotion } from './hooks';

export function ThoughtLine({ steps, activeStep, done }: { steps: string[]; activeStep: number; done?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const elapsed = useElapsed(!done && !reduced);
  return (
    <div className={`thoughtline ${done ? 'done' : ''}`} aria-live="polite">
      <div className="thoughtline-header">
        <div><span className="spark">✦</span><strong>VISUAL GENERATION</strong></div>
        <span>{done ? '0.0s' : `${elapsed.toFixed(1)}s`}</span>
      </div>
      <div className="thoughtline-stage">{done ? 'Report ready ✓' : steps[activeStep] ?? steps[steps.length - 1]}</div>
      <div className="thoughtline-list">
        {steps.map((step, index) => (
          <div key={step} className={index < activeStep || done ? 'complete' : index === activeStep ? 'current' : ''}>
            <span className="thought-icon">{index < activeStep || done ? '✓' : index === activeStep ? '•' : '○'}</span>
            <span>{step.replace('…', '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
