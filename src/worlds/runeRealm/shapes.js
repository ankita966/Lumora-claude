// All shapes are generated as ordered arrays of {x,y} points in a 0-100
// normalized box, so they scale cleanly to any play-area size.

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pointsAlongSegments(waypoints, pointsPerSegment = 14) {
  const pts = [];
  for (let s = 0; s < waypoints.length - 1; s++) {
    for (let i = 0; i <= pointsPerSegment; i++) {
      pts.push(lerp(waypoints[s], waypoints[s + 1], i / pointsPerSegment));
    }
  }
  return pts;
}

export function circlePoints(cx = 50, cy = 50, r = 30, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

export function letterAPoints() {
  const left = pointsAlongSegments([{ x: 30, y: 80 }, { x: 50, y: 20 }]);
  const right = pointsAlongSegments([{ x: 50, y: 20 }, { x: 70, y: 80 }]);
  const bar = pointsAlongSegments([{ x: 38, y: 55 }, { x: 62, y: 55 }], 8);
  return [...left, ...right, ...bar];
}

export function numberSevenPoints() {
  const top = pointsAlongSegments([{ x: 28, y: 24 }, { x: 72, y: 24 }], 16);
  const diag = pointsAlongSegments([{ x: 72, y: 24 }, { x: 42, y: 82 }], 20);
  return [...top, ...diag];
}

export function starPoints(cx = 50, cy = 52, rOuter = 32, rInner = 13) {
  const spikes = 5;
  const step = Math.PI / spikes;
  let rot = (Math.PI / 2) * 3;
  const waypoints = [];
  for (let i = 0; i < spikes; i++) {
    waypoints.push({ x: cx + Math.cos(rot) * rOuter, y: cy + Math.sin(rot) * rOuter });
    rot += step;
    waypoints.push({ x: cx + Math.cos(rot) * rInner, y: cy + Math.sin(rot) * rInner });
    rot += step;
  }
  waypoints.push(waypoints[0]);
  return pointsAlongSegments(waypoints, 6);
}

export function infinityPoints(cx = 50, cy = 50, r = 22, n = 90) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const scale = r / (1 + Math.sin(t) * Math.sin(t));
    pts.push({ x: cx + scale * Math.cos(t), y: cy + (scale * Math.sin(t) * Math.cos(t)) });
  }
  return pts;
}

export const RUNE_ROUNDS = [
  { id: 'shape', title: 'ROUND 1 — SHAPE TRACING', instruction: 'Trace the glowing circle with your fingertip!', getPoints: () => circlePoints(), closed: true },
  { id: 'letter', title: 'ROUND 2 — LETTER TRACING', instruction: 'Trace the magical letter A!', getPoints: () => letterAPoints(), closed: false },
  { id: 'number', title: 'ROUND 3 — NUMBER TRACING', instruction: 'Trace the number 7!', getPoints: () => numberSevenPoints(), closed: false },
  { id: 'rune', title: 'ROUND 4 — RUNE MAGIC', instruction: 'Trace the enchanted star rune!', getPoints: () => starPoints(), closed: true },
  { id: 'master', title: 'ROUND 5 — MASTER RUNE', instruction: 'Trace the infinity rune — the ultimate challenge!', getPoints: () => infinityPoints(), closed: true },
];
