import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';

export const Orb = ({ position }) => {
  const meshRef = useRef(null);
  const [collected, setCollected] = useState(false);
  const addOrb = useGameStore((state) => state.addOrb);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.position.y = Math.sin(performance.now() * 0.003) * 0.12;
  });

  const collect = ({ other }) => {
    if (collected || other.rigidBodyObject?.name !== 'player') return;
    setCollected(true);
    addOrb();
  };

  if (collected) return null;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <BallCollider args={[0.45]} sensor onIntersectionEnter={collect} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#ffd34d" emissive="#ffb300" emissiveIntensity={0.7} />
      </mesh>
    </RigidBody>
  );
};
