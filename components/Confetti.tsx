"use client";

import { useCallback, useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
  life: number;
};

const COLORS = ["#e10600", "#ff8a00", "#ffd166", "#f3f4f6", "#9aa2ad"];

/** Canvas confetti with no dependencies. Re-fires whenever `burst` increments. */
export default function Confetti({
  burst,
  power = 1,
}: {
  burst: number;
  power?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);
  const lastBurst = useRef(0);

  const loop = useCallback(function step() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current = particles.current.filter((p) => p.life > 0 && p.y < canvas.height / dpr + 40);

    for (const p of particles.current) {
      p.vy += 0.14;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    if (particles.current.length > 0) {
      raf.current = requestAnimationFrame(step);
    } else {
      raf.current = null;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (burst === 0 || burst === lastBurst.current) return;
    lastBurst.current = burst;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const count = Math.round(70 * power);
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      particles.current.push({
        x: fromLeft ? w * 0.12 : w * 0.88,
        y: h * 0.62,
        vx: (fromLeft ? 1 : -1) * (3 + Math.random() * 7) * power,
        vy: -(6 + Math.random() * 9) * power,
        size: 6 + Math.random() * 8,
        spin: (Math.random() - 0.5) * 0.4,
        angle: Math.random() * Math.PI,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 90 + Math.random() * 60,
      });
    }

    if (raf.current === null) raf.current = requestAnimationFrame(loop);
  }, [burst, power, loop]);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
