import { levels } from '../levels';
import { useGameStore } from '../store/useGameStore';

export const DeathScreen = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const deathCount = useGameStore((state) => state.deathCount);
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const respawnAtCheckpoint = useGameStore((state) => state.respawnAtCheckpoint);
  const startLevel = useGameStore((state) => state.startLevel);
  const goToMenu = useGameStore((state) => state.goToMenu);

  return (
    <div className="overlay death-overlay scanlines">
      <section className="overlay-card cyber-panel">
        <h2 className="failure-title">SYSTEM FAILURE</h2>
        <p>LEVEL {String(currentLevel + 1).padStart(2, '0')} / DEATHS {deathCount}</p>
        <button className="cyber-btn danger" onClick={respawnAtCheckpoint} type="button">RESPAWN</button>
        <div className="select-rule">SELECT LEVEL</div>
        <div className="mini-levels">
          {levels.map((_, index) => (
            <button
              className="cyber-btn"
              disabled={!unlockedLevels.includes(index)}
              key={index}
              onClick={() => startLevel(index)}
              type="button"
            >
              LVL {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <button className="cyber-btn muted" onClick={goToMenu} type="button">MENU</button>
      </section>
    </div>
  );
};
