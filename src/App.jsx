import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Scene } from './Scene';
import { levels } from './levels';
import { useGameStore } from './store/useGameStore';
import { MainMenu } from './ui/MainMenu';
import './App.css';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'slide', keys: ['KeyC'] },
  { name: 'dash', keys: ['KeyE'] },
];

function App() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const levelRunId = useGameStore((state) => state.levelRunId);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const score = useGameStore((state) => state.score);
  const deathCount = useGameStore((state) => state.deathCount);

  if (gameStatus === 'menu') return <MainMenu />;

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="game-shell">
        <Canvas shadows camera={{ fov: 85, position: [0, 3, 6] }}>
          <Scene key={`${currentLevel}-${levelRunId}`} config={levels[currentLevel]} />
        </Canvas>
        <Hud level={currentLevel} timeRemaining={timeRemaining} score={score} deathCount={deathCount} />
        {gameStatus === 'dead' && <DeathOverlay />}
        {gameStatus === 'levelComplete' && <LevelCompleteOverlay />}
      </div>
    </KeyboardControls>
  );
}

const Hud = ({ level, timeRemaining, score, deathCount }) => (
  <div className="hud">
    <span>Level {level + 1}</span>
    <span>{formatTime(timeRemaining)}</span>
    <span>Score {score}</span>
    <span>Deaths {deathCount}</span>
  </div>
);

const DeathOverlay = () => {
  const respawnAtCheckpoint = useGameStore((state) => state.respawnAtCheckpoint);
  const goToMenu = useGameStore((state) => state.goToMenu);

  return (
    <div className="overlay">
      <h2>YOU DIED</h2>
      <div className="overlay-actions">
        <button onClick={respawnAtCheckpoint}>RESPAWN</button>
        <button onClick={goToMenu}>MENU</button>
      </div>
    </div>
  );
};

const LevelCompleteOverlay = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const score = useGameStore((state) => state.score);
  const startLevel = useGameStore((state) => state.startLevel);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const hasNext = currentLevel + 1 < levels.length;

  return (
    <div className="overlay">
      <h2>{hasNext ? 'LEVEL COMPLETE' : 'YOU WIN'}</h2>
      <p>Score {score}</p>
      <div className="overlay-actions">
        {hasNext && <button onClick={() => startLevel(currentLevel + 1)}>NEXT LEVEL</button>}
        <button onClick={() => startLevel(currentLevel)}>RETRY</button>
        <button onClick={goToMenu}>MENU</button>
      </div>
    </div>
  );
};

const formatTime = (value) => {
  const total = Math.max(0, Math.ceil(value));
  const minutes = Math.floor(total / 60).toString().padStart(2, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default App;
