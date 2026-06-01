"use client";

import { motion } from "framer-motion";

interface SparklineProps {
  points: number[]; // 0-100
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  className?: string;
}

export function Sparkline({
  points,
  width = 480,
  height = 120,
  color = "#22D3EE",
  fill = "rgba(34, 211, 238, 0.18)",
  className,
}: SparklineProps) {
  if (points.length < 2) return null;

  const padX = 4;
  const padY = 8;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  const range = Math.max(1, max - min);

  const stepX = w / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + h - ((p - min) / range) * h;
    return [x, y] as [number, number];
  });

  const linePath = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const fillPath = `${linePath} L${coords[coords.length - 1][0]},${padY + h} L${coords[0][0]},${padY + h} Z`;

  const lastX = coords[coords.length - 1][0];
  const lastY = coords[coords.length - 1][1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id="sp-glow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
        d={fillPath}
        fill="url(#sp-grad)"
        stroke="none"
        style={{ opacity: 0.7 }}
      />
      <motion.path
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#sp-glow)"
      />
      {/* Current point pulse */}
      <motion.circle
        cx={lastX}
        cy={lastY}
        r={4}
        fill={color}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 1.1 }}
      />
      <motion.circle
        cx={lastX}
        cy={lastY}
        r={9}
        fill="none"
        stroke={color}
        strokeWidth={1}
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </svg>
  );
}

