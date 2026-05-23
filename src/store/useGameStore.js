import { create } from 'zustand';

export const useGameStore = create((set) => ({
  gameStatus: 'playing',
  currentLevel: 0,

  timeRemaining: 180,
  timerActive: false,
  tickTimer: (delta) =>
    set((state) => {
      if (!state.timerActive || state.gameStatus !== 'playing') return {};
      const timeRemaining = Math.max(0, state.timeRemaining - delta);
      return {
        timeRemaining,
        gameStatus: timeRemaining === 0 ? 'dead' : state.gameStatus,
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
  setCheckpoint: (pos) => set({ checkpointPos: pos }),

  startLevel: (index) =>
    set({
      gameStatus: 'playing',
      currentLevel: index,
      timeRemaining: [180, 150, 120][index] ?? 180,
      timerActive: true,
    }),
  levelComplete: () => set({ gameStatus: 'levelComplete', timerActive: false }),
  playerDied: () => set({ gameStatus: 'dead' }),
}));
