import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './hooks';

export function TextLoop({ items }: { items: string[] }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced || items.length < 2) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 3400);
    return () => window.clearInterval(id);
  }, [items.length, reduced]);
  return <span className="text-loop">{items[index] ?? ''}</span>;
}
