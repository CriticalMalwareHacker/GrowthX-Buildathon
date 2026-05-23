import { useFrame } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense, useEffect, useRef } from 'react';
import { Player } from './components/Player';
import { PlayerCamera } from './components/PlayerCamera';
import { BoostPad } from './components/BoostPad';
import { Checkpoint } from './components/Checkpoint';
import { JumpPad } from './components/JumpPad';
import { useGameStore } from './store/useGameStore';

const platforms = [
  { pos: [0, -0.25, 0], size: [20, 0.5, 20], color: '#787878' },
  { pos: [10, 3, 0], size: [0.5, 6, 8], color: '#777f8a' },
  { pos: [-10, 3, 0], size: [0.5, 6, 8], color: '#777f8a' },
  { pos: [0, 5, -8], size: [4, 0.5, 4], color: '#969696' },
  { pos: [5, 1.8, 8], size: [6, 0.5, 4], color: '#6f7378' },
];

const Platform = ({ pos, size, color }) => (
  <RigidBody type="fixed" position={pos} colliders="cuboid">
    <mesh receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  </RigidBody>
);

export const Scene = () => {
  const playerRef = useRef(null);
  const cameraStateRef = useRef({ yaw: 0 });
  const startLevel = useGameStore((state) => state.startLevel);

  return (
    <>
      <fogExp2 attach="fog" color="#e8e8e8" density={0.02} />
      <color attach="background" args={['#e8e8e8']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <GameRuntime startLevel={startLevel} />
          <Player ref={playerRef} cameraStateRef={cameraStateRef} />
          {platforms.map((platform) => (
            <Platform key={platform.pos.join(',')} {...platform} />
          ))}
          <JumpPad position={[0, 0.2, -4]} />
          <JumpPad position={[4, 0.2, -5]} direction={[0, 18, -10]} />
          <JumpPad position={[8, 0.2, -2]} direction={[5, 18, -8]} />
          <BoostPad position={[-5, 0.2, 0]} />
          <BoostPad position={[-5, 0.2, 5]} direction={[0, 0, -1]} />
          <Checkpoint position={[0, 0.5, -8]} checkpoint={[0, 6, -8]} />
          <Checkpoint position={[7, 0.5, 7]} checkpoint={[7, 2, 7]} />
        </Physics>
      </Suspense>

      <PlayerCamera playerRef={playerRef} cameraStateRef={cameraStateRef} />
    </>
  );
};

const GameRuntime = ({ startLevel }) => {
  const didStartRef = useRef(false);
  const tickTimer = useGameStore((state) => state.tickTimer);
  const tickBoost = useGameStore((state) => state.tickBoost);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    startLevel(0);
  }, [startLevel]);

  useFrame((_, delta) => {
    tickTimer(delta);
    tickBoost(delta);
  });

  return null;
};
