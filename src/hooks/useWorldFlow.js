import { useCallback, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Drives the "5 smooth rounds" loop used by every world: tracks the current
 * round, attempts, timing, awards XP, logs the activity for the adaptive
 * engine, and transitions cleanly to the next round (or the world-complete
 * overlay after the last one) — never leaving a blank screen.
 */
export function useWorldFlow({ worldKey, skill, totalRounds = 5, xpPerRound = 150, worldBonus = 200 }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [message, setMessage] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const logActivity = useGameStore((s) => s.logActivity);
  const addXp = useGameStore((s) => s.addXp);
  const completeWorld = useGameStore((s) => s.completeWorld);

  const registerAttempt = useCallback(() => setAttempts((a) => a + 1), []);

  const completeRound = useCallback(
    (accuracy = 1, customMsg) => {
      if (transitioning) return;
      setTransitioning(true);
      const timeMs = Math.max(400, Date.now() - startTime);
      logActivity({ world: worldKey, round: roundIndex + 1, skill, accuracy, attempts, timeMs });
      addXp(xpPerRound);
      setMessage(customMsg || 'Great job! ✨');

      const isLast = roundIndex + 1 >= totalRounds;
      if (isLast) {
        completeWorld(worldKey);
        addXp(worldBonus);
        setTimeout(() => setCompleted(true), 1000);
      } else {
        setTimeout(() => {
          setRoundIndex((r) => r + 1);
          setAttempts(1);
          setStartTime(Date.now());
          setMessage(null);
          setTransitioning(false);
        }, 1300);
      }
    },
    [transitioning, startTime, worldKey, skill, roundIndex, attempts, totalRounds, xpPerRound, worldBonus, logActivity, addXp, completeWorld]
  );

  const restart = useCallback(() => {
    setRoundIndex(0);
    setAttempts(1);
    setStartTime(Date.now());
    setMessage(null);
    setCompleted(false);
    setTransitioning(false);
  }, []);

  return {
    roundIndex,
    roundNumber: roundIndex + 1,
    totalRounds,
    attempts,
    message,
    setMessage,
    completed,
    transitioning,
    registerAttempt,
    completeRound,
    restart,
  };
}
