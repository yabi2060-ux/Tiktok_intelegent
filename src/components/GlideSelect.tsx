import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface GlideOption<T extends string> { value: T; label: string; description?: string }

export function GlideSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: GlideOption<T>[];
  onChange: (value: T) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const root = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const onOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, []);

  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = Math.min(options.length - 1, (highlight < 0 ? selectedIndex : highlight) + 1);
      setHighlight(next);
      if (open) onChange(options[next].value);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = Math.max(0, (highlight < 0 ? selectedIndex : highlight) - 1);
      setHighlight(next);
      if (open) onChange(options[next].value);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((openState) => !openState);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="glide-select" ref={root}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className="glide-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={onKeyDown}
      >
        <span>
          <strong>{selected?.label}</strong>
          {selected?.description && <small>{selected.description}</small>}
        </span>
        <span className={`chevron ${open ? 'open' : ''}`} aria-hidden="true">⌄</span>
      </button>
      <div className={`glide-menu ${open ? 'open' : ''}`} role="listbox" aria-label={label}>
        {options.map((option, index) => (
          <button
            type="button"
            role="option"
            aria-selected={value === option.value}
            key={option.value}
            className={`glide-option ${value === option.value ? 'selected' : ''}`}
            onMouseEnter={() => setHighlight(index)}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <span className="glide-indicator" style={{ transform: `translateY(${highlight * 100}%)` }} aria-hidden="true" />
            <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
