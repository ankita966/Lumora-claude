import { useEffect, useState, useCallback } from 'react';
import { useHandTracking } from './useHandTracking';
import { useGameStore } from '../store/useGameStore';

/**
 * Gives every camera-based world one consistent "cursor": the fingertip
 * position when a camera + hand is available, or the mouse/touch position
 * otherwise. Returns pixel coordinates relative to containerRef, plus a
 * `source` flag so the UI can say "Hand detected" vs "Using mouse".
 */
export function useCursor(containerRef, active, { useCamera = true } = {}) {
  const { videoRef, point, pinching, status } = useHandTracking(active && useCamera);
  const setHandConnected = useGameStore((s) => s.setHandConnected);
  const [pixel, setPixel] = useState(null);
  const [mousePoint, setMousePoint] = useState(null);

  useEffect(() => {
    setHandConnected(status === 'ready' && !!point);
  }, [status, point, setHandConnected]);

  useEffect(() => {
    if (!active) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setMousePoint({ x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height });
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('touchmove', onMove);
    };
  }, [active, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const source = status === 'ready' && point ? point : mousePoint;
    if (source) {
      setPixel({ x: source.x * rect.width, y: source.y * rect.height, nx: source.x, ny: source.y });
    }
  }, [point, mousePoint, status, containerRef]);

  const usingHand = status === 'ready' && !!point;

  return {
    videoRef,
    pixel,
    pinching,
    usingHand,
    cameraStatus: status, // idle|loading|ready|denied|error
  };
}
