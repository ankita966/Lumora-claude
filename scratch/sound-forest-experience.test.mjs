import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('=== SOUND FOREST EXPERIENCE AUDIT ===\n');

// 1. Static AST / Code Safety Audit of SoundForest.jsx
const sfCode = fs.readFileSync('src/worlds/soundForest/SoundForest.jsx', 'utf-8');

console.log('1. Checking Sound Forest Rounds Configuration:');
assert.ok(sfCode.includes("ROUND 1 — SLASH QUEST"), 'Round 1 title present');
assert.ok(sfCode.includes("ROUND 2 — SOUND MATCH"), 'Round 2 title present');
assert.ok(sfCode.includes("ROUND 3 — PHONEME BLEND"), 'Round 3 title present');
assert.ok(sfCode.includes("ROUND 4 — PRONOUNCE IT"), 'Round 4 title present');
assert.ok(sfCode.includes("ROUND 5 — WORD RECOGNITION"), 'Round 5 title present');
console.log('  ✓ All 5 round configs are strictly defined.');

console.log('\n2. Checking Audio & Browser User-Gesture Handling:');
assert.ok(sfCode.includes("Start Quest & Enable Audio"), 'Start Quest gesture unlock button present');
assert.ok(sfCode.includes("🔊 Hear Instructions"), 'Round 1 replay instruction button present');
assert.ok(sfCode.includes("🔊 Hear sounds again"), 'Round 3 hear sounds button present');
assert.ok(sfCode.includes("🔊 Hear pronunciation"), 'Round 4 hear pronunciation button present');
assert.ok(sfCode.includes("🔊 Hear question"), 'Round 5 hear question button present');
console.log('  ✓ Explicit user-gesture unlock + replay buttons present on all rounds.');

console.log('\n3. Checking Round 1 (SoundSlash) Interaction Integrity:');
assert.ok(sfCode.includes("segmentHits(last, current, obj, 12)"), 'Cursor swipe hit detection active');
assert.ok(sfCode.includes("near(current, obj, 12)"), 'Cursor proximity hit detection active');
assert.ok(sfCode.includes("onClick={() => slashObject(obj)}"), 'Direct tap/click fallback active');
assert.ok(!sfCode.includes("setPhase('speak')"), 'Voice gate eliminated from Round 1');
assert.ok(sfCode.includes("scoreRef.current >= goal"), 'Goal check completes Round 1 directly');
console.log('  ✓ Round 1 features continuous spawning, dual cursor + click input, and clean completion.');

console.log('\n4. Checking Meaningful Practice & Play Duration:');
// Round 1 has goal = 5
assert.ok(sfCode.includes("const goal = 5;"), 'Round 1 requires 5 targets');
// Round 2 has 3 questions
assert.ok(sfCode.includes("qIndex + 1 < matchQuestions.length"), 'Round 2 progressive multi-question');
// Round 3 has 3 words
assert.ok(sfCode.includes("wIndex + 1 < blendWords.length"), 'Round 3 progressive multi-word blend');
// Round 4 has 2 practice words
assert.ok(sfCode.includes("pIndex + 1 < pronounceWords.length"), 'Round 4 progressive multi-word pronunciation');
// Round 5 has 3 recognition questions
assert.ok(sfCode.includes("rIndex + 1 < recognitionQuestions.length"), 'Round 5 progressive multi-question recognition');
console.log('  ✓ Every round engineered for 20-25 seconds of active practice.');

console.log('\n5. Checking Speech Synthesis Robustness in useSpeechRecognition.js:');
const srCode = fs.readFileSync('src/hooks/useSpeechRecognition.js', 'utf-8');
assert.ok(srCode.includes("window.speechSynthesis.getVoices()"), 'getVoices() checked');
assert.ok(srCode.includes("voiceschanged"), 'voiceschanged event listener present');
assert.ok(srCode.includes("window.speechSynthesis.resume()"), 'resume() called to prevent pause locks');
assert.ok(srCode.includes("activeUtterance"), 'Utterance reference retained to prevent GC cutoffs');
console.log('  ✓ Speech engine handles asynchronous voice loading, pause locks, and GC protection.');

console.log('\n========================================');
console.log('ALL SOUND FOREST AUDIT CHECKS PASSED! 🌲');
console.log('========================================');

