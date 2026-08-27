import { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './useHandTracking';
import { useGameStore } from '../store/useGameStore';

/**
 * Unified Cursor & Gesture Bridge.
 * Bridges Camera Hand Tracking + Multi-Gesture Engine with mouse/touch fallback.
 */
export function useCursor(containerRef, active, { useCamera = true } = {}) {
  const {
    videoRef,
    point,
    rawPoint,
    smoothedRef,
    gesture,
    gestureLabel,
    gestureHoldMs,
    pinching,
    handDetected,
    confidence,
    status,
    stopCamera,
  } = useHandTracking(active && useCamera);

  const setHandConnected = useGameStore((s) => s.setHandConnected);
  const [pixel, setPixel] = useState(null);
  const [mousePoint, setMousePoint] = useState(null);
  const prevPixelRef = useRef(null);

  useEffect(() => {
    setHandConnected(status === 'ready' && handDetected);
  }, [status, handDetected, setHandConnected]);

  useEffect(() => {
    if (!active) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setMousePoint({
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      });
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
    const source = status === 'ready' && handDetected && point ? point : mousePoint;
    if (source) {
      const px = source.x * rect.width;
      const py = source.y * rect.height;
      const prev = prevPixelRef.current;
      if (prev) {
        const sx = prev.x + (px - prev.x) * 0.65;
        const sy = prev.y + (py - prev.y) * 0.65;
        prevPixelRef.current = { x: sx, y: sy, nx: sx / rect.width, ny: sy / rect.height };
      } else {
        prevPixelRef.current = { x: px, y: py, nx: source.x, ny: source.y };
      }
      setPixel({ ...prevPixelRef.current });
    }
  }, [point, mousePoint, status, handDetected, containerRef]);

  const usingHand = status === 'ready' && handDetected;

  return {
    videoRef,
    pixel,
    point,
    rawPoint,
    smoothedRef,
    gesture,
    gestureLabel,
    gestureHoldMs,
    pinching,
    usingHand,
    handDetected,
    confidence,
    cameraStatus: status, // idle|loading|ready|denied|error
    stopCamera,
  };
}
