import { usePrefersReducedMotion } from './hooks';

export function MaskedHeading({ children = 'WELCOME', active = true }: { children?: string; active?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className={`masked-heading ${active ? 'is-active' : ''} ${reducedMotion ? 'reduced' : ''}`} aria-label={children} role="img">
      <span>{children}</span>
    </div>
  );
}
