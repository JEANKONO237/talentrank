"use client";

import {
  Children,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AnimationSequence,
  motion,
  type Target,
  type Transition,
  useAnimate,
  useAnimationFrame,
} from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { useMouseVector } from "@/components/hooks/use-mouse-vector";

type TrailSegment = [Target, Transition];
type TrailAnimationSequence = TrailSegment[];

interface ImageTrailProps {
  children: ReactNode;
  containerRef?: RefObject<HTMLElement | null>;
  newOnTop?: boolean;
  rotationRange?: number;
  animationSequence?: TrailAnimationSequence;
  /** Minimum ms between spawn. Smaller = denser trail. */
  interval?: number;
}

interface TrailItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
  child: ReactNode;
}

// Mouse-following trail. As the cursor moves, items from `children` are
// spawned at the cursor position, animated through `animationSequence`,
// and removed once their animation completes.
export function ImageTrail({
  children,
  containerRef,
  newOnTop = true,
  rotationRange = 12,
  animationSequence = [
    [{ scale: 1.15, opacity: 1 }, { duration: 0.12, ease: "circOut" }],
    [{ scale: 0, opacity: 0 }, { duration: 0.6, ease: "circIn" }],
  ],
  interval = 110,
}: ImageTrailProps) {
  const [items, setItems] = useState<TrailItem[]>([]);
  const lastAddedRef = useRef(0);
  const indexRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const { position } = useMouseVector(containerRef);
  const childrenArray = useMemo(() => Children.toArray(children), [children]);

  const addToTrail = useCallback(
    (pos: { x: number; y: number }) => {
      const child = childrenArray[indexRef.current];
      indexRef.current = (indexRef.current + 1) % Math.max(1, childrenArray.length);

      const newItem: TrailItem = {
        id: uuidv4(),
        x: pos.x,
        y: pos.y,
        rotation: (Math.random() - 0.5) * rotationRange * 2,
        child,
      };
      setItems((prev) => (newOnTop ? [...prev, newItem] : [newItem, ...prev]));
    },
    [childrenArray, rotationRange, newOnTop],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useAnimationFrame((time) => {
    if (position.x === lastMouseRef.current.x && position.y === lastMouseRef.current.y) return;
    lastMouseRef.current = position;
    if (time - lastAddedRef.current < interval) return;
    lastAddedRef.current = time;
    addToTrail(position);
  });

  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((item) => (
        <TrailItemView
          key={item.id}
          item={item}
          sequence={animationSequence}
          onComplete={removeItem}
        />
      ))}
    </div>
  );
}

function TrailItemView({
  item,
  sequence,
  onComplete,
}: {
  item: TrailItem;
  sequence: TrailAnimationSequence;
  onComplete: (id: string) => void;
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const seq = sequence.map((seg) => [scope.current, ...seg]);
    animate(seq as AnimationSequence).then(() => onComplete(item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={scope}
      className="absolute"
      style={{ left: item.x, top: item.y, rotate: item.rotation, x: "-50%", y: "-50%" }}
    >
      {item.child}
    </motion.div>
  );
}
