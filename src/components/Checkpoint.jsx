import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';

export const Checkpoint = ({ position, checkpoint = position }) => {
  const ringRef = useRef(null);
  const activatedRef = useRef(false);
  const [active, setActive] = useState(false);
  const setCheckpoint = useGameStore((state) => state.setCheckpoint);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.5;
  });

  const activateCheckpoint = ({ other }) => {
    if (activatedRef.current || other.rigidBodyObject?.name !== 'player') return;
    activatedRef.current = true;
    setActive(true);
    setCheckpoint(checkpoint);
    // TODO: Play checkpoint chime when Phase 4 audio assets are added.
  };

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[1, 1.2, 0.25]} sensor onIntersectionEnter={activateCheckpoint} />
      <mesh ref={ringRef} castShadow>
        <torusGeometry args={[1, 0.08, 16, 48]} />
        <meshStandardMaterial
          color={active ? '#44ff88' : '#e5e5e5'}
          emissive={active ? '#44ff88' : '#777777'}
          emissiveIntensity={active ? 0.9 : 0.35}
        />
      </mesh>
    </RigidBody>
  );
};
