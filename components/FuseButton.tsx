import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode, MouseEvent } from 'react';

interface FuseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  busy?: boolean;
  destructive?: boolean;
}

export function FuseButton({ children, busy, destructive, className = '', onClick, disabled, ...props }: FuseButtonProps) {
  const [pressed, setPressed] = useState(false);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 180);
    onClick?.(event);
  };
  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || busy}
      className={`fuse-button ${destructive ? 'destructive' : ''} ${pressed ? 'is-pressed' : ''} ${busy ? 'is-busy' : ''} ${className}`}
    >
      <span>{children}</span>
      {busy && <span className="button-orbit" aria-hidden="true" />}
    </button>
  );
}
