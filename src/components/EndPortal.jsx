import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';

export const EndPortal = ({ position }) => {
  const portalRef = useRef(null);
  const triggeredRef = useRef(false);
  const levelComplete = useGameStore((state) => state.levelComplete);

  useFrame((_, delta) => {
    if (portalRef.current) portalRef.current.rotation.y += delta;
  });

  const finishLevel = ({ other }) => {
    if (triggeredRef.current || other.rigidBodyObject?.name !== 'player') return;
    triggeredRef.current = true;
    levelComplete();
  };

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[1.2, 1.6, 0.35]} sensor onIntersectionEnter={finishLevel} />
      <mesh ref={portalRef}>
        <torusGeometry args={[1.1, 0.12, 16, 64]} />
        <meshStandardMaterial color="#6cf3ff" emissive="#00cfff" emissiveIntensity={1.2} />
      </mesh>
    </RigidBody>
  );
};
