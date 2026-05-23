import { create } from 'zustand';
import { levels } from '../levels';

const getMedalForTime = (timeRemaining, targetTimes) => {
  if (timeRemaining >= targetTimes.gold) return 'gold';
  if (timeRemaining >= targetTimes.silver) return 'silver';
  if (timeRemaining >= targetTimes.bronze) return 'bronze';
  return null;
};

export const useGameStore = create((set) => ({
  gameStatus: 'menu',
  currentLevel: 0,
  levelRunId: 0,
  unlockedLevels: [0],
  bestTimes: [null, null, null],
  bestMedals: [null, null, null],
  deathCount: 0,

  timeRemaining: 180,
  timerActive: false,
  tickTimer: (delta) =>
    set((state) => {
      if (!state.timerActive || state.gameStatus !== 'playing') return {};
      const timeRemaining = Math.max(0, state.timeRemaining - delta);
      return {
        timeRemaining,
        timerActive: timeRemaining > 0,
      };
    }),

  score: 0,
  orbsCollected: 0,
  addOrb: () =>
    set((state) => ({
      score: state.score + 10,
      orbsCollected: state.orbsCollected + 1,
    })),

  boostActive: false,
  boostTimeLeft: 0,
  activateBoost: () => set({ boostActive: true, boostTimeLeft: 2 }),
  tickBoost: (delta) =>
    set((state) => {
      if (!state.boostActive) return {};
      const boostTimeLeft = Math.max(0, state.boostTimeLeft - delta);
      return {
        boostTimeLeft,
        boostActive: boostTimeLeft > 0,
      };
    }),

  checkpointPos: [0, 2, 0],
  checkpointIndex: -1,
  setCheckpoint: (pos, index = -1) => set({ checkpointPos: pos, checkpointIndex: index }),

  startLevel: (index) =>
    set((state) => ({
      gameStatus: 'playing',
      currentLevel: index,
      levelRunId: state.levelRunId + 1,
      timeRemaining: levels[index]?.timer ?? 180,
      timerActive: true,
      deathCount: 0,
      checkpointPos: levels[index]?.spawnPos ?? [0, 2, 0],
      checkpointIndex: -1,
      boostActive: false,
      boostTimeLeft: 0,
      score: 0,
      orbsCollected: 0,
    })),
  levelComplete: () =>
    set((state) => {
      const idx = state.currentLevel;
      const nextIdx = idx + 1;
      const unlockedLevels =
        nextIdx < levels.length && !state.unlockedLevels.includes(nextIdx)
          ? [...state.unlockedLevels, nextIdx]
          : state.unlockedLevels;
      const medal = getMedalForTime(state.timeRemaining, levels[idx].targetTimes);
      const timeRemaining = Math.floor(state.timeRemaining);
      const bestTimes = [...state.bestTimes];
      const bestMedals = [...state.bestMedals];

      if (bestTimes[idx] === null || timeRemaining > bestTimes[idx]) {
        bestTimes[idx] = timeRemaining;
        bestMedals[idx] = medal;
      }

      return {
        gameStatus: 'levelComplete',
        timerActive: false,
        unlockedLevels,
        bestTimes,
        bestMedals,
      };
    }),
  playerDied: () => set({ gameStatus: 'dead', timerActive: false }),
  respawnAtCheckpoint: () => set({ gameStatus: 'playing', timerActive: true, boostActive: false, boostTimeLeft: 0 }),
  incrementDeaths: () => set((state) => ({ deathCount: state.deathCount + 1 })),
  playerSpeed: 0,
  setPlayerSpeed: (speed) => set({ playerSpeed: speed }),
  goToMenu: () => set({ gameStatus: 'menu', timerActive: false }),
}));
