// Rune Realm target paths use a shared 0–100 coordinate system so the SVG
// guide and the hand/mouse drawing can scale with the play area.

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function pointsAlongSegments(waypoints, pointsPerSegment = 12) {
  const points = [];
  for (let segment = 0; segment < waypoints.length - 1; segment += 1) {
    for (let point = 0; point <= pointsPerSegment; point += 1) {
      points.push(lerp(waypoints[segment], waypoints[segment + 1], point / pointsPerSegment));
    }
  }
  return points;
}

export function circlePoints(cx = 50, cy = 50, radius = 29, count = 56) {
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

function arcPoints(cx, cy, radius, start, end, count = 30) {
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / count;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

function starPoints(cx = 50, cy = 52, outer = 31, inner = 13) {
  const corners = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const radius = index % 2 === 0 ? outer : inner;
    corners.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  corners.push(corners[0]);
  return pointsAlongSegments(corners, 7);
}

function wavePoints() {
  return Array.from({ length: 61 }, (_, index) => {
    const x = 16 + index * (68 / 60);
    return { x, y: 50 + Math.sin((index / 60) * Math.PI * 2) * 22 };
  });
}

const line = (a, b, density = 16) => pointsAlongSegments([a, b], density);

const TARGETS = {
  horizontal: { label: 'Horizontal line', getPoints: () => line({ x: 20, y: 50 }, { x: 80, y: 50 }, 30) },
  vertical: { label: 'Vertical line', getPoints: () => line({ x: 50, y: 20 }, { x: 50, y: 80 }, 30) },
  curve: { label: 'Curved line', getPoints: () => arcPoints(50, 64, 31, Math.PI * 1.08, Math.PI * 1.92, 38) },
  zigzag: { label: 'Zig-zag', getPoints: () => pointsAlongSegments([{ x: 18, y: 68 }, { x: 34, y: 32 }, { x: 50, y: 68 }, { x: 66, y: 32 }, { x: 82, y: 68 }], 10) },
  wave: { label: 'Wave', getPoints: () => wavePoints() },
  loop: { label: 'Loop', closed: true, getPoints: () => circlePoints(50, 50, 29, 56) },
  circle: { label: 'Circle', closed: true, fillable: true, getPoints: () => circlePoints() },
  triangle: { label: 'Triangle', closed: true, fillable: true, getPoints: () => pointsAlongSegments([{ x: 50, y: 18 }, { x: 80, y: 78 }, { x: 20, y: 78 }, { x: 50, y: 18 }], 16) },
  square: { label: 'Square', closed: true, fillable: true, getPoints: () => pointsAlongSegments([{ x: 24, y: 24 }, { x: 76, y: 24 }, { x: 76, y: 76 }, { x: 24, y: 76 }, { x: 24, y: 24 }], 14) },
  star: { label: 'Star', closed: true, fillable: true, getPoints: () => starPoints() },
  ancient: { label: 'Ancient rune', getPoints: () => pointsAlongSegments([{ x: 50, y: 16 }, { x: 50, y: 70 }, { x: 27, y: 47 }, { x: 50, y: 70 }, { x: 73, y: 47 }, { x: 50, y: 16 }], 12) },
  // A is one continuous child-friendly route: up the left leg, down the
  // right leg, back up that same leg to the crossbar, then across. The prior
  // path jumped diagonally from the bottom-right to the crossbar, so a child
  // following the visible letter could not reliably advance the tracer.
  A: { label: 'A', getPoints: () => pointsAlongSegments([{ x: 28, y: 80 }, { x: 50, y: 18 }, { x: 72, y: 80 }, { x: 63, y: 56 }, { x: 37, y: 56 }], 16) },
  B: { label: 'B', getPoints: () => [...line({ x: 30, y: 18 }, { x: 30, y: 82 }), ...arcPoints(30, 36, 20, -Math.PI / 2, Math.PI / 2, 18), ...arcPoints(30, 64, 20, -Math.PI / 2, Math.PI / 2, 18)] },
  C: { label: 'C', getPoints: () => arcPoints(53, 50, 31, Math.PI * 0.25, Math.PI * 1.75, 42) },
  D: { label: 'D', getPoints: () => [...line({ x: 29, y: 18 }, { x: 29, y: 82 }), ...arcPoints(29, 50, 32, -Math.PI / 2, Math.PI / 2, 34)] },
  '1': { label: '1', getPoints: () => [...line({ x: 40, y: 30 }, { x: 52, y: 18 }, 8), ...line({ x: 52, y: 18 }, { x: 52, y: 82 }, 24)] },
  '2': { label: '2', getPoints: () => [...arcPoints(50, 38, 25, Math.PI * 1.18, Math.PI * 2.05, 22), ...line({ x: 72, y: 43 }, { x: 25, y: 82 }, 20), ...line({ x: 25, y: 82 }, { x: 75, y: 82 }, 16)] },
  '3': { label: '3', getPoints: () => [...arcPoints(40, 36, 24, -Math.PI / 2, Math.PI / 2, 20), ...arcPoints(40, 64, 24, -Math.PI / 2, Math.PI / 2, 20)] },
  '4': { label: '4', getPoints: () => [...line({ x: 68, y: 82 }, { x: 68, y: 18 }, 22), ...line({ x: 68, y: 18 }, { x: 25, y: 60 }, 18), ...line({ x: 25, y: 60 }, { x: 78, y: 60 }, 18)] },
  '5': { label: '5', getPoints: () => [...line({ x: 74, y: 20 }, { x: 30, y: 20 }, 16), ...line({ x: 30, y: 20 }, { x: 30, y: 48 }, 10), ...arcPoints(45, 56, 23, Math.PI, Math.PI * 2.1, 24)] },
};

export const RUNE_ROUNDS = [
  { id: 'magic-circle', title: 'TRACE THE MAGIC CIRCLE', instruction: 'Move your hand through every glowing dot!', target: 'circle', success: '✨ CIRCLE COMPLETE!' },
  { id: 'letter-rune', title: 'TRACE THE MAGIC LETTER', instruction: 'Follow every glowing dot to make an A!', target: 'A', success: '✨ LETTER COMPLETE!' },
  { id: 'number-rune', title: 'TRACE THE MAGIC NUMBER', instruction: 'Follow every glowing dot to make a 3!', target: '3', success: '✨ NUMBER COMPLETE!' },
  { id: 'star-rune', title: 'TRACE THE MAGIC STAR', instruction: 'Follow the glowing dots around the star!', target: 'star', success: '⭐ STAR ACTIVATED!' },
  { id: 'ancient-rune', title: 'TRACE THE ANCIENT RUNE', instruction: 'Awaken every glowing rune dot!', target: 'ancient', success: '✨ ANCIENT RUNE AWAKENED!' },
];

export function getRuneTarget(id) {
  return TARGETS[id];
}

// Rune Realm's game mechanic uses discrete, ordered dots rather than a
// visible outline. Keeping the source paths here makes every dot layout
// consistent, scalable, and easy to adjust without changing interaction code.
export function getRuneDots(id) {
  const source = TARGETS[id]?.getPoints();
  if (!source) return [];
  const count = id === 'circle' ? 22 : id === 'star' ? 21 : id === 'ancient' ? 19 : 18;
  return Array.from({ length: count }, (_, index) => source[Math.round(index * (source.length - 1) / (count - 1))]);
}
