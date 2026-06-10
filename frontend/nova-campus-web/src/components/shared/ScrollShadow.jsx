'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Wraps horizontally-scrollable content (tables, etc.) and shows shadow
// overlays on the edges that still have content to scroll to, so users on
// narrow screens know more content is available. The overlays are layered on
// top of the scrollable content so they stay visible above table/grid
// backgrounds (an inset box-shadow on the scroll container would be hidden
// behind opaque cell backgrounds).
export default function ScrollShadow({ children, className = '' }) {
  const ref = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[15px] transition-opacity duration-250"
        style={{
          background: 'linear-gradient(to right, var(--color-border), transparent)',
          opacity: showLeft ? 1 : 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[15px] transition-opacity duration-250"
        style={{
          background: 'linear-gradient(to left, var(--color-border), transparent)',
          opacity: showRight ? 1 : 0,
        }}
      />
    </div>
  );
}
