/**
 * Web Audio API Sound Synthesizer for Lumora.
 * Zero-dependency, low-latency procedural audio engine for retro chiptune chimes,
 * 8-bit tactile clicks, magic gesture swooshes, and victory fanfares.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a retro 8-bit melodic arpeggio / chime.
 * @param {number} pitch - Frequency multiplier
 * @param {number} volume - Volume (0.0 to 1.0)
 */
export function playChime(pitch = 1.0, volume = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFreq = 440 * pitch; // A4
    const now = ctx.currentTime;

    // 8-bit arpeggio: 3 notes played rapidly
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Major triad

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Smooth retro triangle wave
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25 * volume, now + idx * 0.04 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.4);
    });
  } catch {
    /* Audio disabled or blocked */
  }
}

/**
 * Retro 8-bit square wave blip for button presses.
 */
export function playClick(volume = 0.35) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // 8-bit arcade click
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.02); // A5

    gain.gain.setValueAtTime(0.18 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    /* noop */
  }
}

/**
 * 8-bit Coin / Star collect sound.
 */
export function playCoin(volume = 0.4) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch {
    /* noop */
  }
}

/**
 * Magic gesture swoosh for air tracing and pinches.
 */
export function playSwoosh(volume = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    /* noop */
  }
}

/**
 * Celebratory 8-bit fanfare for world mastery and quest completion.
 */
export function playFanfare(volume = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Iconic retro triumphant arpeggio sequence
    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.35 } // C6
    ];

    let t = ctx.currentTime;
    notes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3 * volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + item.d + 0.25);

      t += item.d;
    });
  } catch {
    /* noop */
  }
}
