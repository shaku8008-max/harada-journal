"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import React from "react";

type AetherFlowHeroProps = { email?: string };

export function AetherFlowHero({ email }: AetherFlowHeroProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const drawingCanvas = canvas;
    const drawingContext = context;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Array<{ x: number; y: number; dx: number; dy: number; size: number }> = [];
    let animationFrame = 0;

    function resize() {
      drawingCanvas.width = window.innerWidth * window.devicePixelRatio;
      drawingCanvas.height = window.innerHeight * window.devicePixelRatio;
      drawingCanvas.style.width = `${window.innerWidth}px`;
      drawingCanvas.style.height = `${window.innerHeight}px`;
      drawingContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function seed() {
      particles.length = 0;
      const count = Math.min(110, Math.max(35, Math.floor((window.innerWidth * window.innerHeight) / 14000)));
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          dx: (Math.random() - 0.5) * 0.22,
          dy: (Math.random() - 0.5) * 0.22,
          size: Math.random() * 1.5 + 0.7,
        });
      }
    }

    function draw() {
      drawingContext.fillStyle = "#090a10";
      drawingContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        if (!reducedMotion) {
          particle.x = (particle.x + particle.dx + window.innerWidth) % window.innerWidth;
          particle.y = (particle.y + particle.dy + window.innerHeight) % window.innerHeight;
        }
        drawingContext.beginPath();
        drawingContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        drawingContext.fillStyle = "rgba(196, 154, 255, 0.72)";
        drawingContext.fill();
      });
      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const dx = particles[first].x - particles[second].x;
          const dy = particles[first].y - particles[second].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 145) {
            drawingContext.beginPath();
            drawingContext.moveTo(particles[first].x, particles[first].y);
            drawingContext.lineTo(particles[second].x, particles[second].y);
            drawingContext.strokeStyle = `rgba(167, 123, 230, ${0.2 * (1 - distance / 145)})`;
            drawingContext.stroke();
          }
        }
      }
      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    }

    resize();
    seed();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("resize", seed);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", seed);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const fadeUp: Variants = { hidden: { opacity: 0, y: 18 }, visible: (delay: number) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.7, ease: "easeOut" as const } }) };

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-24 sm:px-8">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(115,65,170,0.22),transparent_42%),linear-gradient(180deg,rgba(9,10,16,0.18),#090a10_92%)]" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div custom={0.25} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--aether-lilac)]/25 bg-[var(--aether-lilac)]/10 px-4 py-2 text-sm font-medium text-[var(--aether-lilac)] backdrop-blur-sm">
          <Zap className="size-4" aria-hidden="true" />
          <span>Open Window 64</span>
        </motion.div>
        <motion.h1 custom={0.4} variants={fadeUp} initial="hidden" animate="visible" className="text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
          Open the window.
        </motion.h1>
        <motion.p custom={0.55} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
          Turn one meaningful goal into eight directions, then make the next move visible. Your private space for thinking clearly and showing up steadily.
        </motion.p>
        <motion.div custom={0.7} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/chart" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-[var(--aether-lilac)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--aether-lilac)]">
            {email ? "Enter your journal" : "Enter your journal"}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </motion.div>
        <p className="mt-7 text-sm text-white/35">Signed in as {email}</p>
      </div>
    </section>
  );
}
