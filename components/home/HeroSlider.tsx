"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  slides: string[]; // urls
  heightClass?: string; // e.g. "h-[72vh] min-h-[520px]"
};

export default function HeroSlider({ slides, heightClass = "h-[72vh] min-h-[520px]" }: Props) {
  const clean = useMemo(() => slides.filter(Boolean), [slides]);
  const list = clean.length ? clean : ["", "", ""]; // fallback
  const [i, setI] = useState(0);

  function prev() {
    setI((x) => (x - 1 + list.length) % list.length);
  }
  function next() {
    setI((x) => (x + 1) % list.length);
  }

  useEffect(() => {
    const t = setInterval(() => next(), 6500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`}>
      {/* Slides */}
      {list.map((url, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: url ? `url(${url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* warm overlay (not black) */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,240,0.65),rgba(255,248,240,0.25),rgba(255,248,240,0.15))]" />
        </div>
      ))}

      {/* Arrows */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/80 backdrop-blur border border-black/10 hover:bg-white transition flex items-center justify-center"
        aria-label="Previous"
      >
        <span className="text-xl">‹</span>
      </button>

      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/80 backdrop-blur border border-black/10 hover:bg-white transition flex items-center justify-center"
        aria-label="Next"
      >
        <span className="text-xl">›</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {list.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-2.5 w-2.5 rounded-full border ${
              idx === i ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-white/70 border-black/10"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
