import { useMemo } from 'react';
import { levels } from '../levels';
import { useGameStore } from '../store/useGameStore';
import { formatClock } from './format';

export const LevelComplete = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const orbsCollected = useGameStore((state) => state.orbsCollected);
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const startLevel = useGameStore((state) => state.startLevel);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const hasNext = currentLevel + 1 < levels.length;
  const medal = getMedal(timeRemaining, levels[currentLevel].targetTimes);
  const timeScore = Math.floor(timeRemaining) * 10;
  const orbScore = orbsCollected * 10;
  const totalScore = timeScore + orbScore;

  const heading = hasNext ? `LEVEL ${String(currentLevel + 1).padStart(2, '0')} COMPLETE` : 'RUN COMPLETE';
  const medalClass = useMemo(() => medal?.toLowerCase() ?? 'none', [medal]);

  return (
    <div className="overlay complete-overlay scanlines">
      <section className="overlay-card cyber-panel">
        <h2 className={`glitch-title ${hasNext ? '' : 'gold-title'}`}>{heading}</h2>
        {!hasNext && <p>YOU ARE IN THE 20%</p>}
        {medal && <div className={`medal-pop ${medalClass}`}>{medal}</div>}
        <div className="score-panel cyber-panel">
          <span>TIME REMAINING</span><strong>{formatClock(timeRemaining)}</strong><small>x10 = {timeScore}</small>
          <span>ORBS COLLECTED</span><strong>{orbsCollected}</strong><small>x10 = {orbScore}</small>
          <span className="total-label">TOTAL SCORE</span><strong className="total-score">{totalScore}</strong><small />
        </div>
        <div className="overlay-actions">
          {hasNext && <button className="cyber-btn success" onClick={() => startLevel(currentLevel + 1)} type="button">NEXT LEVEL</button>}
          <button className="cyber-btn" onClick={() => startLevel(currentLevel)} type="button">RETRY</button>
        </div>
        <div className="select-rule">SELECT LEVEL</div>
        <div className="mini-levels">
          {levels.map((_, index) => (
            <button className="cyber-btn" disabled={!unlockedLevels.includes(index)} key={index} onClick={() => startLevel(index)} type="button">
              LVL {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <button className="cyber-btn muted" onClick={goToMenu} type="button">MENU</button>
      </section>
    </div>
  );
};

const getMedal = (time, targets) => {
  if (time >= targets.gold) return 'GOLD';
  if (time >= targets.silver) return 'SILVER';
  if (time >= targets.bronze) return 'BRONZE';
  return null;
};
