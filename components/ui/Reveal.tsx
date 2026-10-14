"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content up once as it enters the viewport. Skipped for reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);

    // Anything already in view when the page loads reveals on the next frame,
    // rather than waiting for a scroll that may never come.
    const frame = requestAnimationFrame(() => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        setShown(true);
        observer.disconnect();
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(10px)",
        transition: `opacity 620ms cubic-bezier(0.2,0.7,0.3,1) ${delay}ms, transform 620ms cubic-bezier(0.2,0.7,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
