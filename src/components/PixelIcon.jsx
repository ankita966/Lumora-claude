import React from 'react';

/**
 * PixelIcon — crisp rect-based pixel-art icons (shapeRendering: crispEdges).
 * Replaces system Unicode emoji (🦊🦉🐯🦋🐼🌲👁️🏰✍️🧠) which render fuzzy,
 * off-palette, and OS-dependent — the loudest "student project" tell on a
 * pixel-art product. Palette-locked: black ink + one brand accent each.
 * All glyphs designed on a 12×12 grid.
 */
const GLYPHS = {
  // ---- Heroes ----
  Kai: (
    <>
      {/* Fox: ears + head, amber */}
      <path fill="#000000" d="M1 1h4v4H1zM7 1h4v4H7zM0 3h12v7H0zM2 10h8v2H2z" />
      <path fill="#E5A83B" d="M2 2h2v2H2zM8 2h2v2H8zM1 4h10v5H1zM3 10h6v1H3z" />
      <path fill="#000000" d="M3 6h2v2H3zM7 6h2v2H7z" />
      <path fill="#FFFFFF" d="M5 8h2v1H5z" />
    </>
  ),
  Maya: (
    <>
      {/* Owl: head + facial disc, pink */}
      <path fill="#000000" d="M2 1h8v2H2zM1 3h10v7H1zM0 5h1v3H0zM11 5h1v3h-1zM2 10h8v2H2z" />
      <path fill="#FF2E93" d="M2 2h8v7H2zM3 10h6v1H3z" />
      <path fill="#FFFFFF" d="M3 5h2v3H3zM7 5h2v3H7z" />
      <path fill="#000000" d="M4 6h1v1H4zM8 6h1v1H8z" />
      <path fill="#E5A83B" d="M5 8h2v1H5z" />
    </>
  ),
  Leo: (
    <>
      {/* Tiger: face + stripes, sky blue */}
      <path fill="#000000" d="M1 2h10v8H1zM2 10h8v2H2zM3 1h2v1H3zM7 1h2v1H7z" />
      <path fill="#38B6FF" d="M2 3h8v6H2zM3 10h6v1H3z" />
      <path fill="#000000" d="M2 4h1v2H2zM9 4h1v2H9zM4 3h1v2H4zM7 3h1v2H7z" />
      <path fill="#000000" d="M3 6h2v2H3zM7 6h2v2H7z" />
      <path fill="#FFFFFF" d="M5 8h2v1H5z" />
    </>
  ),
  Zara: (
    <>
      {/* Butterfly: wings + body, amber wings */}
      <path fill="#000000" d="M1 2h4v4H1zM7 2h4v4H7zM1 6h4v4H1zM7 6h4v4H7zM5 1h2v10H5z" />
      <path fill="#E5A83B" d="M2 3h2v2H2zM8 3h2v2H8zM2 7h2v2H2zM8 7h2v2H8zM6 2v8" />
      <path fill="#E2E8F0" d="M6 2h0M5 1h2v10H5zM5 1h2v10H5z" />
      <path fill="#090B14" d="M6 2h0" />
    </>
  ),
  Aria: (
    <>
      {/* Panda: white face + black patches */}
      <path fill="#000000" d="M2 1h3v3H2zM7 1h3v3H7zM1 3h10v8H1z" />
      <path fill="#E2E8F0" d="M2 4h8v6H2zM3 1h1v2H3zM8 1h1v2H8z" />
      <path fill="#000000" d="M3 5h2v3H3zM7 5h2v3H7z" />
      <path fill="#000000" d="M5 8h2v1H5z" />
      <path fill="#FF2E93" d="M5 9h2v1H5z" />
    </>
  ),
  // ---- Realms ----
  soundForest: (
    <>
      {/* Pine tree */}
      <path fill="#000000" d="M5 0h2v2H5zM3 2h6v3H3zM2 5h8v3H2zM1 8h10v2H1zM5 10h2v2H5z" />
      <path fill="#38B6FF" d="M5 1h1v1H5zM4 3h4v2H4zM3 6h6v2H3zM2 9h8v1H2zM5 11h2v1H5z" />
      <path fill="#0D5EB5" d="M6 3h2v2H6zM7 6h2v2H7z" />
    </>
  ),
  visionValley: (
    <>
      {/* Eye */}
      <path fill="#000000" d="M1 4h10v4H1zM2 3h8v1H2zM2 8h8v1H2zM5 3h2v6H5z" />
      <path fill="#FFFFFF" d="M3 5h6v2H3z" />
      <path fill="#48B8D0" d="M2 5h1v2H2zM9 5h1v2H9z" />
      <path fill="#000000" d="M5 5h2v2H5z" />
      <path fill="#38B6FF" d="M6 5h1v1H6z" />
    </>
  ),
  storyCastle: (
    <>
      {/* Castle: towers + gate, amber */}
      <path fill="#000000" d="M1 1h3v1H1zM8 1h3v1H8zM1 2h2v9H1zM9 2h2v9H9zM4 4h4v7H4zM3 3h6v1H3z" />
      <path fill="#E5A83B" d="M2 3h1v7H2zM10 3h1v7h-1zM5 5h2v5H5zM4 3h4v1H4z" />
      <path fill="#090B14" d="M5 8h2v3H5z" />
    </>
  ),
  runeRealm: (
    <>
      {/* Rune glyph (angular, like ᚱ) */}
      <path fill="#000000" d="M2 0h2v12H2zM4 0h4v2H4zM4 5h5v2H4zM6 7h3v2H6zM4 10h4v2H4zM8 2h2v4H8z" />
      <path fill="#FF2E93" d="M3 1h1v10H3zM5 1h2v3H5zM5 6h2v1H5zM7 8h1v2H7zM5 11h2v1H5z" />
    </>
  ),
  memoryMountains: (
    <>
      {/* Twin peaks + flag */}
      <path fill="#000000" d="M0 12V8h2V6h2v2h1V5h2V3h2v2h1v3h2v4H0z" />
      <path fill="#A47BE0" d="M1 9h1v2H1zM3 7h1v4H3zM5 6h1v5H5zM7 4h1v7H7zM9 6h1v5H9z" />
      <path fill="#FF2E93" d="M8 0h3v2H8z" />
      <path fill="#E2E8F0" d="M8 0h1v2H8z" />
    </>
  ),
};

export default function PixelIcon({ name, size = 18 }) {
  const glyph = GLYPHS[name] || GLYPHS.Kai;
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      {glyph}
    </svg>
  );
}
