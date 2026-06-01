"use client";

import { type RefObject, useEffect, useState } from "react";

// Tracks the mouse position (and movement vector) relative to a container
// or to the window. Used by ImageTrail to spawn trail items at the cursor.
export const useMouseVector = (containerRef?: RefObject<HTMLElement | SVGElement | null>) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [vector, setVector] = useState({ dx: 0, dy: 0 });

  useEffect(() => {
    let lastPosition = { x: 0, y: 0 };

    const updatePosition = (x: number, y: number) => {
      let newX: number;
      let newY: number;

      if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        newX = x - rect.left;
        newY = y - rect.top;
      } else {
        newX = x;
        newY = y;
      }

      const dx = newX - lastPosition.x;
      const dy = newY - lastPosition.y;

      setVector({ dx, dy });
      setPosition({ x: newX, y: newY });
      lastPosition = { x: newX, y: newY };
    };

    const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (t) updatePosition(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return { position, vector };
};
