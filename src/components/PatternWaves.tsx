import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

export function PatternWaves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let start = performance.now();
    const pointer = { x: 0.5, y: 0.45, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX / Math.max(1, window.innerWidth);
      pointer.y = event.clientY / Math.max(1, window.innerHeight);
      pointer.active = true;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const draw = (now: number) => {
      const t = reducedMotion ? 0 : (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#030305';
      context.fillRect(0, 0, width, height);

      const spacing = Math.max(18, Math.min(29, width / 52));
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const angle = -0.34;
      const sweep = ((t * 0.075) % 1.4) - 0.2;
      const px = pointer.active ? pointer.x * width : width * 0.5;
      const py = pointer.active ? pointer.y * height : height * 0.45;

      context.save();
      context.translate(width * 0.5, height * 0.5);
      context.rotate(angle);
      context.translate(-width * 0.5, -height * 0.5);

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          const wavePosition = (x / width) * 0.8 + (y / height) * 0.35;
          const distance = Math.abs((((wavePosition - sweep + 1) % 1) - 0.5) * 2);
          const wave = Math.max(0, 1 - distance * 7);
          const pointerDist = Math.hypot(x - px, y - py);
          const pointerGlow = pointer.active ? Math.max(0, 1 - pointerDist / 230) * 0.5 : 0;
          const alpha = 0.11 + wave * 0.25 + pointerGlow * 0.12;
          const radius = 0.85 + wave * 1.35 + pointerGlow * 0.5;
          context.beginPath();
          context.fillStyle = `rgba(109, 40, 217, ${alpha})`;
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.restore();

      context.save();
      const grad = context.createLinearGradient(0, height, width, 0);
      grad.addColorStop(0, 'rgba(3,3,5,0)');
      grad.addColorStop(0.45, 'rgba(139,92,246,0)');
      grad.addColorStop(0.52, 'rgba(167,139,250,0.07)');
      grad.addColorStop(0.57, 'rgba(76,29,149,0.04)');
      grad.addColorStop(1, 'rgba(3,3,5,0)');
      context.fillStyle = grad;
      context.fillRect(0, 0, width, height);
      context.restore();

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="pattern-waves" aria-hidden="true" />;
}
