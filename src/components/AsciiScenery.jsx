import React, { useMemo } from 'react';

/**
 * AsciiScenery — pixel-terminal ASCII dioramas that dress the negative space
 * around game rounds. Deterministic per mount (no flicker), calm (one slow
 * twinkle class), zero external deps. Palette-locked via CSS.
 *
 * Variants: 'mountains' | 'forest' | 'castle' | 'valley' | 'runes'
 */

const SCENES = {
  mountains: [
    '                    /\\                    ',
    '                   /  \\      /\\           ',
    '          /\\      /    \\    /  \\   /\\     ',
    '         /  \\    /      \\  /    \\ /  \\    ',
    '        /    \\  /        \\/      /    \\   ',
    '   /\\  /      \\/          \\      /      \\ ',
    '  /  \\/                             /\\    ',
    ' /                                  \\/    ',
    '___________________________________________',
  ],
  forest: [
    '     ^       ^       ^       ^       ^     ',
    '    /|\\     /|\\     /|\\     /|\\     /|\\   ',
    '   / | \\   / | \\   / | \\   / | \\   / | \\  ',
    '  /  |  \\ /  |  \\ /  |  \\ /  |  \\ /  |  \\ ',
    '    /|\\       /|\\      /|\\      /|\\       ',
    '   / | \\     / | \\    / | \\    / | \\      ',
    '  /__|__\\   /__|__\\  /__|__\\  /__|__\\     ',
    '__________________________________________',
  ],
  castle: [
    '   |\\  |\\         /\\          /|  /|      ',
    '   | \\ | \\  _____/  \\_____   / | / |      ',
    '   |  \\|  \\ |    ___    |  /  |/  |       ',
    '   |   |   ||   |   |   | /   ||   |      ',
    '   |   дверь ||   |*|   |/    ||   |      ',
    '   |___|___||___|___|___|     ||___|      ',
    '__________________________________________',
  ],
};

// trim: castle art uses only ASCII-safe chars; fix non-ascii row
SCENES.castle[4] = '   |   |   ||   |o|   |/    ||   |      ';

const DITHER_CHARS = ['.', '·', ':', '+', '*'];
const GLYPH_MAP = { '/': '/', '\\': '\\', '_': '_', '|': '|', '^': '^' };

export default function AsciiScenery({ variant = 'mountains', side = 'left', seed = 1 }) {
  const lines = SCENES[variant] || SCENES.mountains;

  // Deterministic twinkle positions from seed — same render every mount
  const twinkles = useMemo(() => {
    const set = new Set();
    let s = seed * 2654435761;
    for (let i = 0; i < 7; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      set.add(s % 100); // 0-99 keyed index
    }
    return set;
  }, [seed]);

  let glyphIndex = 0;
  return (
    <div className={`ascii-scenery ascii-scenery--${side}`} aria-hidden="true">
      <pre className="ascii-art">
        {lines.map((line, li) => (
          <span key={li} className="ascii-line">
            {line.split('').map((ch, ci) => {
              if (ch === ' ') return ' ';
              const key = `${li}-${ci}`;
              const isTwinkle = twinkles.has(glyphIndex % 100);
              glyphIndex++;
              return (
                <span key={key} className={isTwinkle ? 'ascii-tw' : undefined}>
                  {ch}
                </span>
              );
            })}
            {'\n'}
          </span>
        ))}
      </pre>
      <span className="ascii-caption">
        {`// ${variant.toUpperCase()} SECTOR`}
      </span>
    </div>
  );
}
