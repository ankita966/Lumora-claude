import React, { useState, useCallback } from 'react';
import MagicMirror from './MagicMirror';
import MagicCursor from './MagicCursor';

/**
 * HandCursorLayer — Integrates the MagicMirror camera view and the
 * MagicCursor energy trail into the game's play area with multi-gesture feedback.
 */
export default function HandCursorLayer({
  videoRef,
  pixel,
  cameraStatus,
  handDetected,
  gesture = 'none',
  gestureLabel = '',
  pinching = false,
  interacting = false,
  color = '#4fd8ff',
  bursts = [],
  showMirror = true,
  showCursor = true,
  cameraActive = true,
  onEnableCamera,
}) {
  const [mirrorExpanded, setMirrorExpanded] = useState(false);

  const toggleMirror = useCallback(() => {
    setMirrorExpanded((prev) => !prev);
  }, []);

  return (
    <>
      {/* Magic Mirror — camera portal with gesture feedback */}
      {showMirror && (
        <MagicMirror
          videoRef={videoRef}
          cameraStatus={cameraStatus}
          handDetected={handDetected}
          gesture={gesture}
          gestureLabel={gestureLabel}
          expanded={mirrorExpanded}
          onToggle={toggleMirror}
          color={color}
          cameraActive={cameraActive}
          onEnableCamera={onEnableCamera}
        />
      )}

      {/* Magic Cursor — cyan energy trail */}
      {showCursor && (
        <MagicCursor
          pixel={pixel}
          gesture={gesture}
          pinching={pinching || gesture === 'pinch'}
          interacting={interacting}
          color={color}
          bursts={bursts}
        />
      )}
    </>
  );
}
