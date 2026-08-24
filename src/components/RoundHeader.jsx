import React from 'react';

export default function RoundHeader({ title, subtitle, progress, color }) {
  return (
    <div className="round-header" style={{ '--world-color': color }}>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {typeof progress === 'number' && (
        <div className="progress-track" style={{ marginTop: 14 }}>
          <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%`, '--world-color': color }} />
        </div>
      )}
    </div>
  );
}
