import { useState } from 'react';
import { levels } from '../levels';
import { useGameStore } from '../store/useGameStore';
import { formatBest } from './format';

const difficulty = ['EASY', 'MEDIUM', 'HARD'];

export const MainMenu = () => {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const startLevel = useGameStore((state) => state.startLevel);
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const bestTimes = useGameStore((state) => state.bestTimes);
  const bestMedals = useGameStore((state) => state.bestMedals);
  const selectedUnlocked = unlockedLevels.includes(selectedLevel);

  return (
    <main className="menu-screen scanlines">
      <section className="menu-card cyber-panel">
        <h1 className="glitch-title">VEGA PARKOUR</h1>
        <div className="menu-rule" />
        <p className="menu-kicker">CHOOSE YOUR RUN</p>

        <div className="level-row">
          {levels.map((_, index) => {
            const unlocked = unlockedLevels.includes(index);
            const selected = selectedLevel === index;
            return (
              <button
                key={index}
                className={`level-card cyber-panel ${selected ? 'selected' : ''} ${unlocked ? '' : 'locked'}`}
                onClick={() => setSelectedLevel(index)}
                type="button"
              >
                <span>LVL {String(index + 1).padStart(2, '0')}</span>
                <strong>{difficulty[index]}</strong>
                <small>{unlocked ? formatBest(bestTimes[index], bestMedals[index]) : 'LOCKED'}</small>
              </button>
            );
          })}
        </div>

        <button className="cyber-btn success start-run" disabled={!selectedUnlocked} onClick={() => startLevel(selectedLevel)} type="button">
          START LEVEL {selectedLevel + 1}
        </button>

        <p className="controls-hint">WASD MOVE / SPACE JUMP / SHIFT SPRINT / C SLIDE / E DASH</p>
      </section>
    </main>
  );
};
