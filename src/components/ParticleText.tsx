import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

export function ParticleText({ text = 'VELLORA' }: { text?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 900;
    let height = 240;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let frame = 0;
    let start = performance.now();
    let particles: Array<{ x: number; y: number; tx: number; ty: number; phase: number }> = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(120, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement('canvas');
      off.width = Math.floor(width * dpr);
      off.height = Math.floor(height * dpr);
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.scale(dpr, dpr);
      const fontSize = Math.min(190, width * 0.24);
      octx.font = `800 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#fff';
      octx.fillText(text, width / 2, height / 2 + 3);
      const image = octx.getImageData(0, 0, off.width, off.height);
      const stride = Math.max(5, Math.floor(8 / dpr));
      const targets: Array<[number, number]> = [];
      for (let y = 0; y < off.height; y += stride) {
        for (let x = 0; x < off.width; x += stride) {
          const alpha = image.data[(y * off.width + x) * 4 + 3];
          if (alpha > 80) targets.push([x / dpr, y / dpr]);
        }
      }
      const targetCount = Math.min(reducedMotion ? 900 : 1400, targets.length);
      particles = [];
      for (let i = 0; i < targetCount; i++) {
        const [tx, ty] = targets[Math.floor((i / targetCount) * targets.length)];
        particles.push({
          tx,
          ty,
          x: width / 2 + (Math.random() - 0.5) * width * 1.4,
          y: height / 2 + (Math.random() - 0.5) * height * 1.8,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (now: number) => {
      const t = reducedMotion ? 4 : (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (t - 0.2) / 3.8));
      const ease = 1 - Math.pow(1 - progress, 3);

      particles.forEach((particle, index) => {
        particle.x += (particle.tx - particle.x) * (0.025 + ease * 0.075);
        particle.y += (particle.ty - particle.y) * (0.025 + ease * 0.075);
        const idle = progress >= 1 && !reducedMotion ? Math.sin(t * 0.8 + particle.phase) * 0.55 : 0;
        const violet = index % 11 === 0;
        ctx.beginPath();
        ctx.fillStyle = violet ? 'rgba(167, 139, 250, 0.9)' : 'rgba(245,245,247,0.92)';
        ctx.shadowColor = violet ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.1)';
        ctx.shadowBlur = violet ? 7 : 2;
        ctx.arc(particle.x, particle.y + idle, violet ? 1.45 : 1.15, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, reducedMotion]);

  return (
    <div className="particle-text-wrap">
      <canvas ref={ref} className="particle-text" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
