import React from 'react';

export default function HandCursorLayer({ videoRef, pixel, cameraStatus, color }) {
  return (
    <>
      <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
      <div className="tag-pill">
        {cameraStatus === 'ready' && pixel
          ? '✋ Hand detected — you are connected'
          : cameraStatus === 'loading'
          ? 'Starting camera…'
          : cameraStatus === 'denied'
          ? 'Camera unavailable — using mouse/touch instead'
          : cameraStatus === 'error'
          ? 'Camera error — using mouse/touch instead'
          : '🖱 Move your mouse or finger to play'}
      </div>
      {pixel && (
        <div className="hand-cursor" style={{ left: pixel.x, top: pixel.y, '--world-color': color }} />
      )}
    </>
  );
}
