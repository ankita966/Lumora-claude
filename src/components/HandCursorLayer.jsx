import React, { useState, useCallback } from 'react';
import MagicMirror from './MagicMirror';
import MagicCursor from './MagicCursor';

/**
 * HandCursorLayer — Integrates the MagicMirror camera view and the
 * MagicCursor energy trail into the game's play area.
 *
 * Shows the child's camera feed in a beautiful mirror/portal,
 * and renders the cyan magic cursor that follows their fingertip.
 */
export default function HandCursorLayer({
  videoRef,
  pixel,
  cameraStatus,
  handDetected,
  pinching = false,
  interacting = false,
  color = '#4fd8ff',
  bursts = [],
  showMirror = true,
  showCursor = true,
}) {
  const [mirrorExpanded, setMirrorExpanded] = useState(false);

  const toggleMirror = useCallback(() => {
    setMirrorExpanded((prev) => !prev);
  }, []);

  return (
    <>
      {/* Magic Mirror — camera portal */}
      {showMirror && (
        <MagicMirror
          videoRef={videoRef}
          cameraStatus={cameraStatus}
          handDetected={handDetected}
          expanded={mirrorExpanded}
          onToggle={toggleMirror}
          color={color}
        />
      )}

      {/* Magic Cursor — cyan energy trail */}
      {showCursor && (
        <MagicCursor
          pixel={pixel}
          pinching={pinching}
          interacting={interacting}
          color={color}
          bursts={bursts}
        />
      )}
    </>
  );
}
