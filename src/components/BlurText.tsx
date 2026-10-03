import type { ReactNode } from 'react';

export function BlurText({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={`blur-text ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}
