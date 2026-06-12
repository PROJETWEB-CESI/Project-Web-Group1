'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

const PULL_THRESHOLD = 40; // how far the user needs to pull down before releasing triggers a refresh
const MAX_PULL = 50; // maximum pull distance that affects the indicator (beyond this it just stays put and doesn't stretch further)
const INDICATOR_SIZE = 40; // diameter of the circular refresh indicator

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

  // When idle, push the indicator (including its shadow) fully above the
  // viewport so no trace of it is visible in normal use.
  const HIDDEN_OFFSET = -INDICATOR_SIZE * 0.5;
  const indicatorOffset = (HIDDEN_OFFSET + Math.min(pullDistance, MAX_PULL)) * 2.5;

  // opacity of 0 as default, 1 as soon as user starts pulling
  const opacity = pullDistance > 0 ? 1 : 0;

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      <div
        className="fixed left-1/2 top-0 z-40 flex justify-center pointer-events-none"
        style={{ transform: `translate(-50%, ${indicatorOffset}px)`, transition: refreshing ? 'none' : 'transform 0.2s' }}
      >
        <div
          className="flex items-center justify-center rounded-full text-[var(--color-surface-hover)] shadow-md bg-[var(--color-text)]"
          style={{ width: INDICATOR_SIZE, height: INDICATOR_SIZE, opacity: opacity, transition: refreshing ? 'none' : 'opacity 0.2s' }}
        >
          <RotateCw
            className={refreshing ? 'w-6 h-6 animate-spin' : 'w-6 h-6'}
            style={refreshing ? undefined : { transform: `rotate(${Math.pow(pullDistance / PULL_THRESHOLD, 2) * 180}deg)` }}
          />
        </div>
      </div>
      {/* Only apply a transform while actively pulling/animating back — an
          always-on `transform` (even translateY(0px)) creates a CSS containing
          block, which would break `position: fixed` modals rendered inside
          `children` (they'd be positioned relative to this div instead of the viewport). */}
      <div
        className="h-full"
        style={pullDistance !== 0 ? { transform: `translateY(${pullDistance}px)`, transition: refreshing ? 'none' : 'transform 0.5s' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
