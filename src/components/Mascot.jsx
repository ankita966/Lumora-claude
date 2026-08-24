import React from 'react';

export default function Mascot({ message, color = 'var(--cyan)', icon = '🤖' }) {
  return (
    <div className="mascot-wrap" style={{ '--world-color': color }}>
      <div className="mascot-face">{icon}</div>
      {message && <div className="mascot-bubble">{message}</div>}
    </div>
  );
}
