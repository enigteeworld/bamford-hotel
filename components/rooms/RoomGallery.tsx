"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  title?: string;
};

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  if (i < 0) return len - 1;
  if (i >= len) return 0;
  return i;
}

export default function RoomGallery({ images, title }: Props) {
  const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [idx, setIdx] = useState(0);

  const startX = useRef<number | null>(null);
  const deltaX = useRef<number>(0);

  useEffect(() => {
    // reset index when list changes
    setIdx(0);
  }, [list.length]);

  function prev() {
    setIdx((p) => clampIndex(p - 1, list.length));
  }

  function next() {
    setIdx((p) => clampIndex(p + 1, list.length));
  }

  // keyboard support when focused
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (list.length <= 1) return;
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  }

  // simple swipe
  function onTouchStart(e: React.TouchEvent) {
    if (list.length <= 1) return;
    startX.current = e.touches[0]?.clientX ?? null;
    deltaX.current = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current == null) return;
    const x = e.touches[0]?.clientX ?? startX.current;
    deltaX.current = x - startX.current;
  }

  function onTouchEnd() {
    if (startX.current == null) return;
    const dx = deltaX.current;
    startX.current = null;
    deltaX.current = 0;

    // threshold
    if (Math.abs(dx) < 40) return;
    if (dx > 0) prev();
    else next();
  }

  return (
    <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
      <div
        className="relative aspect-[16/9] bg-black/[0.04]"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {list.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-black/45">
            No images yet
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={list[idx]}
            alt={title ? `${title} image ${idx + 1}` : `Room image ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}

        {/* arrows */}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white w-10 h-10 grid place-items-center hover:bg-black/70 transition"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white w-10 h-10 grid place-items-center hover:bg-black/70 transition"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* dots */}
        {list.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={[
                  "h-2.5 w-2.5 rounded-full transition",
                  i === idx ? "bg-white" : "bg-white/40 hover:bg-white/65",
                ].join(" ")}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* thumbnails */}
      {list.length > 1 && (
        <div className="p-4 border-t border-[var(--line)] bg-white">
          <div className="flex gap-3 overflow-x-auto">
            {list.map((u, i) => (
              <button
                key={u + i}
                type="button"
                onClick={() => setIdx(i)}
                className={[
                  "w-20 h-14 rounded-xl overflow-hidden border flex-shrink-0",
                  i === idx ? "border-[var(--primary)]" : "border-[var(--line)] hover:border-black/25",
                ].join(" ")}
                aria-label={`Select image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
