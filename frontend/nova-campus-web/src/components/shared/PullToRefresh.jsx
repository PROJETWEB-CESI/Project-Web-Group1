'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
const INDICATOR_SIZE = 40;

// Wraps scrollable dashboard content and lets touch users pull down from the
// top of the scroll area to reload the page (mobile "swipe down to refresh").
export default function PullToRefresh({ children, className = '' }) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (refreshing) return;
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      } else {
        pullingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!pullingRef.current || refreshing) return;

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0 || el.scrollTop > 0) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }

      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, MAX_PULL));
    };

    const handleTouchEnd = () => {
      if (!pullingRef.current || refreshing) return;
      pullingRef.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        window.location.reload();
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing]);

  const indicatorOffset = Math.min(pullDistance, MAX_PULL) - INDICATOR_SIZE;

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      <div
        className="absolute left-0 right-0 top-0 flex justify-center pointer-events-none"
        style={{ transform: `translateY(${indicatorOffset}px)`, transition: refreshing ? 'none' : 'transform 0.2s' }}
      >
        <div
          className="flex items-center justify-center rounded-full bg-[var(--color-surface)] shadow-md text-[var(--color-primary)]"
          style={{ width: INDICATOR_SIZE, height: INDICATOR_SIZE }}
        >
          <RefreshCw
            className={refreshing ? 'w-5 h-5 animate-spin' : 'w-5 h-5'}
            style={refreshing ? undefined : { transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)` }}
          />
        </div>
      </div>
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: refreshing ? 'none' : 'transform 0.2s' }}>
        {children}
      </div>
    </div>
  );
}
