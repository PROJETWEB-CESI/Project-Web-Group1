'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Wraps horizontally-scrollable content (tables, etc.) and shows inset shadows
// on the edges that still have content to scroll to, so users on narrow
// screens know more content is available.
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

  const shadowLeft = 'inset 15px 0 15px -15px var(--color-border-stronger)';
  const shadowRight = 'inset -15px 0 15px -15px var(--color-border-stronger)';
  const boxShadow = [showLeft && shadowLeft, showRight && shadowRight].filter(Boolean).join(', ');

  return (
    <div
      ref={ref}
      onScroll={update}
      className={`overflow-x-auto ${className}`}
      style={boxShadow ? { boxShadow } : undefined}
    >
      {children}
    </div>
  );
}
