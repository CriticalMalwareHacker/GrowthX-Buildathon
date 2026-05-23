import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Scene } from './Scene';
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
  return (
    <KeyboardControls map={keyboardMap}>
      <div className="game-shell">
        <Canvas shadows camera={{ fov: 85, position: [0, 3, 6] }}>
          <Scene />
        </Canvas>
      </div>
    </KeyboardControls>
  );
}

export default App;
