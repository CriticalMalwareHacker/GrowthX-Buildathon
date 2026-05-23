import { useGameStore } from '../store/useGameStore';
import { formatClock } from './format';

export const HUD = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const score = useGameStore((state) => state.score);
  const deathCount = useGameStore((state) => state.deathCount);
  const boostActive = useGameStore((state) => state.boostActive);
  const boostTimeLeft = useGameStore((state) => state.boostTimeLeft);
  const playerSpeed = useGameStore((state) => state.playerSpeed);
  const dashReady = useGameStore((state) => state.dashReady);
  const dashCooldownPct = useGameStore((state) => state.dashCooldownPct);

  const speedOpacity = boostActive ? 1 : Math.min(playerSpeed / 12, 0.5);

  return (
    <>
      <div className="speed-vignette" style={{ opacity: speedOpacity }} />
      <div className="chroma-shift" style={{ opacity: boostActive ? 1 : 0 }} />
      <div className="hud-level cyber-panel">
        <span>LEVEL {String(currentLevel + 1).padStart(2, '0')} / 03</span>
        <span className={deathCount > 0 ? 'danger-text' : ''}>DEATHS {deathCount}</span>
      </div>
      <div className={`hud-timer cyber-panel ${timeRemaining < 20 ? 'urgent' : ''}`}>{formatClock(timeRemaining)}</div>
      <div className="hud-score cyber-panel">
        <span>◆ {score} PTS</span>
        {score > 0 && <span className="score-pop" key={score}>+10</span>}
      </div>
      <div className={`boost-meter ${boostActive ? 'visible' : ''}`}>
        <span>BOOST</span>
        <div><i style={{ width: `${(boostTimeLeft / 2) * 100}%` }} /></div>
      </div>
      <div className={`dash-meter ${dashReady ? 'ready' : ''}`}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" />
          <circle cx="20" cy="20" r="16" style={{ strokeDashoffset: `${100 - dashCooldownPct * 100}` }} />
        </svg>
        <span>DASH</span>
      </div>
    </>
  );
};
