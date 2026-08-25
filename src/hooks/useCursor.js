import { useEffect, useRef, useState, useCallback } from 'react';
import { useHandTracking } from './useHandTracking';
import { useGameStore } from '../store/useGameStore';

/**
 * Gives every camera-based world one consistent "cursor": the fingertip
 * position when a camera + hand is available, or the mouse/touch position
 * otherwise. Returns pixel coordinates relative to containerRef, plus a
 * `source` flag so the UI can say "Hand detected" vs "Using mouse".
 *
 * Enhanced with smooth interpolation and dual-source tracking.
 */
export function useCursor(containerRef, active, { useCamera = true } = {}) {
  const { videoRef, point, rawPoint, pinching, handDetected, confidence, status, stopCamera } =
    useHandTracking(active && useCamera);
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
    const source = status === 'ready' && handDetected && point ? point : mousePoint;
    if (source) {
      const px = source.x * rect.width;
      const py = source.y * rect.height;
      // Smooth the final pixel output too
      const prev = prevPixelRef.current;
      if (prev) {
        const sx = prev.x + (px - prev.x) * 0.6;
        const sy = prev.y + (py - prev.y) * 0.6;
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
    rawPoint,
    pinching,
    usingHand,
    handDetected,
    confidence,
    cameraStatus: status, // idle|loading|ready|denied|error
    stopCamera,
  };
}
