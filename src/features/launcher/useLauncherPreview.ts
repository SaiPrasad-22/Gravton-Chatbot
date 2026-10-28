import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTO_CLOSE_DELAY_MS, AUTO_OPEN_DELAY_MS } from '../../config';

interface Options {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Automatically opens the panel, then closes it if the visitor does not interact.
 */
export function useLauncherPreview({ isOpen, open, close }: Options) {
  const interacted = useRef(false);
  const isOpenRef = useRef(isOpen);
  const [attention, setAttention] = useState(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setAttention(false);
  }, [isOpen]);

  useEffect(() => {
    let closeTimer: number | undefined;
    const openTimer = window.setTimeout(() => {
      if (interacted.current || isOpenRef.current) return;
      open();
      closeTimer = window.setTimeout(() => {
        if (interacted.current) return;
        close();
        setAttention(true);
      }, AUTO_CLOSE_DELAY_MS);
    }, AUTO_OPEN_DELAY_MS);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, [open, close]);

  const markInteracted = useCallback(() => {
    interacted.current = true;
  }, []);

  return { attention, markInteracted };
}
