import { levels } from '../levels';
import { useGameStore } from '../store/useGameStore';

export const MainMenu = () => {
  const startLevel = useGameStore((state) => state.startLevel);
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const bestTimes = useGameStore((state) => state.bestTimes);
  const bestMedals = useGameStore((state) => state.bestMedals);

  return (
    <main className="menu-screen">
      <h1>VEGA PARKOUR</h1>
      <div className="level-row">
        {levels.map((_, index) => {
          const unlocked = unlockedLevels.includes(index);
          return (
            <button key={index} className="level-button" disabled={!unlocked} onClick={() => startLevel(index)}>
              <span>Level {index + 1}</span>
              <small>{unlocked ? formatBest(bestTimes[index], bestMedals[index]) : 'LOCKED'}</small>
            </button>
          );
        })}
      </div>
      <p>WASD move | Shift sprint | Space jump | C slide | E dash | Click game to lock mouse</p>
    </main>
  );
};

const formatBest = (time, medal) => {
  if (time === null) return 'No clear yet';
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}${medal ? ` ${medal}` : ''}`;
};
