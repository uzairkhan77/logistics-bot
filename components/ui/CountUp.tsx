"use client";

import { useEffect, useRef, useState } from "react";

function parse(value: string) {
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return null;
  return {
    target: Number(match[1].replace(/,/g, "")),
    suffix: match[2],
    decimals: match[1].includes(".") ? match[1].split(".")[1].length : 0,
  };
}

/** Rolls a figure up once when it scrolls into view, keeping any suffix intact. */
export function CountUp({ value }: { value: string }) {
  const parsed = parse(value);
  const target = parsed?.target ?? 0;
  const suffix = parsed?.suffix ?? "";
  const decimals = parsed?.decimals ?? 0;
  const animatable = parsed !== null;

  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  // Depends only on primitives — deriving `parsed` inline would restart the
  // animation on every render and it would never reach the figure.
  useEffect(() => {
    const el = ref.current;
    if (!el || !animatable) return;

    let frame = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(target);
        return;
      }
      const start = performance.now();
      const duration = 900;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic — quick off the line, settles cleanly on the figure.
        setDisplay(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
        else setDisplay(target);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    // Figures already on screen at load roll straight away.
    const kick = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        observer.disconnect();
        run();
      }
    });

    return () => {
      cancelAnimationFrame(kick);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [animatable, target]);

  if (!animatable) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref} className="tnum">
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
