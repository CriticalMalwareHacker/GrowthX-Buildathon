import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Scene } from './Scene';
import { levels } from './levels';
import { useGameStore } from './store/useGameStore';
import { DeathScreen } from './ui/DeathScreen';
import { HUD } from './ui/HUD';
import { LevelComplete } from './ui/LevelComplete';
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

  if (gameStatus === 'menu') return <MainMenu />;

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="game-shell">
        <Canvas shadows camera={{ fov: 85, position: [0, 3, 6] }}>
          <Scene key={`${currentLevel}-${levelRunId}`} config={levels[currentLevel]} />
        </Canvas>
        {gameStatus === 'playing' && <HUD />}
        {gameStatus === 'dead' && <DeathScreen />}
        {gameStatus === 'levelComplete' && <LevelComplete />}
      </div>
    </KeyboardControls>
  );
}

export default App;
