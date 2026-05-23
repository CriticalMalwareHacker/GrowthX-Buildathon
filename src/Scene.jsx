import { useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useRef } from 'react';
import { Level } from './Level';
import { Player } from './components/Player';
import { PlayerCamera } from './components/PlayerCamera';
import { useGameStore } from './store/useGameStore';

export const Scene = ({ config }) => {
  const playerRef = useRef(null);
  const cameraStateRef = useRef({ yaw: 0 });

  return (
    <>
      <fogExp2 attach="fog" color="#e8e8e8" density={0.018} />
      <color attach="background" args={['#e8e8e8']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <GameRuntime />
          <Player ref={playerRef} cameraStateRef={cameraStateRef} spawnPos={config.spawnPos} />
          <Level config={config} />
        </Physics>
      </Suspense>

      <PlayerCamera playerRef={playerRef} cameraStateRef={cameraStateRef} />
    </>
  );
};

const GameRuntime = () => {
  const tickTimer = useGameStore((state) => state.tickTimer);
  const tickBoost = useGameStore((state) => state.tickBoost);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameStatus === 'playing') {
      if (state.timerActive && state.timeRemaining <= delta) {
        state.incrementDeaths();
        state.playerDied();
      } else {
        tickTimer(delta);
      }
    }
    tickBoost(delta);
  });

  return null;
};
