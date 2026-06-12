'use client';

import { useRef } from 'react';

// Returns mousedown/mouseup handlers for a modal backdrop element so it only
// closes when both the press and release happen on the backdrop itself —
// e.g. selecting text inside the modal and releasing the mouse outside of it
// (over the backdrop) must not close the modal.
export default function useBackdropClose(onClose) {
  const pressedOnBackdrop = useRef(false);

  return {
    onMouseDown: (e) => {
      pressedOnBackdrop.current = e.target === e.currentTarget;
    },
    onMouseUp: (e) => {
      if (pressedOnBackdrop.current && e.target === e.currentTarget) {
        onClose();
      }
      pressedOnBackdrop.current = false;
    },
  };
}
