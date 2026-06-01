"use client";

import { useEffect, useRef } from "react";

// A soft green glow that follows the mouse — premium effect, lightweight.
// Uses CSS transform on a fixed div, throttled to rAF, so it stays at 60fps.
export function GreenCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);
  const target = useRef({ x: -1000, y: -1000 });
  const current = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const tick = () => {
      // Smooth follow with easing
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] h-[280px] w-[280px] rounded-full mix-blend-screen"
      style={{
        background:
          "radial-gradient(circle, rgba(88,204,2,0.35) 0%, rgba(88,204,2,0.12) 35%, transparent 70%)",
        filter: "blur(10px)",
        willChange: "transform",
      }}
    />
  );
}
