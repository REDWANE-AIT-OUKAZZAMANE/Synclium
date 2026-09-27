"use client";

import { useEffect, useRef } from "react";

/* Clip-wipe reveal driven by IntersectionObserver. One hook, whole journey.
   Threshold 0 + bottom rootMargin: tall sections (compiler, arrival) can never
   satisfy a fractional threshold, so any pixel entering view reveals them. A
   timed fallback guarantees visibility even if the observer misfires. */
export function useRevealRoot<T extends HTMLElement>() {
  const root = useRef<T | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("js");
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll(".syn-reveal"));
    const reveal = (t: Element) => t.classList.add("is-on");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    const fallback = setTimeout(() => {
      targets.forEach(reveal);
      io.disconnect();
    }, 6000);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return root;
}
