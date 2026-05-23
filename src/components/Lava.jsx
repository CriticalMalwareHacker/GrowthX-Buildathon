import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';
import { useKillPlayer } from '../hooks/useKillPlayer';

export const Lava = ({ config }) => {
  const bodyRef = useRef(null);
  const yRef = useRef(config.startY);
  const checkpointIndex = useGameStore((state) => state.checkpointIndex);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const killPlayer = useKillPlayer();

  useFrame((state, delta) => {
    if (!bodyRef.current) return;
    if (gameStatus === 'playing' && config.rising) {
      const accelerated = config.riseAccelAfterCheckpoint !== undefined && checkpointIndex >= config.riseAccelAfterCheckpoint;
      yRef.current = Math.min(config.maxY ?? 7, yRef.current + (accelerated ? config.riseSpeedFinal : config.riseSpeed) * delta);
    }
    bodyRef.current.setNextKinematicTranslation({
      x: 0,
      y: yRef.current + Math.sin(state.clock.elapsedTime * 1.5) * 0.05,
      z: -55,
    });
  });

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={[0, config.startY, -55]} colliders={false}>
      <CuboidCollider args={[50, 0.1, 75]} onCollisionEnter={killPlayer} />
      <mesh receiveShadow>
        <boxGeometry args={[100, 0.2, 150]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.65} transparent opacity={0.45} />
      </mesh>
    </RigidBody>
  );
};
