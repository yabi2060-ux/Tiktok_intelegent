import { useElapsed, usePrefersReducedMotion } from './hooks';

export function LatticeLoader({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  const reduced = usePrefersReducedMotion();
  const elapsed = useElapsed(!reduced);
  return (
    <div className="lattice-loader" aria-live="polite">
      <div className="lattice-orbit" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <div className="lattice-copy">
        <span className="eyebrow">DATA PROCESSING</span>
        <strong>{steps[Math.min(activeStep, steps.length - 1)]}</strong>
        <span className="loader-time">{reduced ? '—' : `${elapsed.toFixed(1)}s`}</span>
      </div>
    </div>
  );
}
