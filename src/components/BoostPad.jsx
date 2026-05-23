import { useRef } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';

export const BoostPad = ({ position, direction = [0, 0, -1] }) => {
  const hasTriggeredRef = useRef(false);
  const activateBoost = useGameStore((state) => state.activateBoost);
  const angle = Math.atan2(direction[0], direction[2]);

  const triggerBoost = ({ other }) => {
    if (hasTriggeredRef.current || other.rigidBodyObject?.name !== 'player') return;
    hasTriggeredRef.current = true;
    activateBoost();
  };

  const resetBoostPad = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') hasTriggeredRef.current = false;
  };

  return (
    <RigidBody
      name="boostpad"
      type="fixed"
      position={position}
      colliders={false}
      onCollisionEnter={triggerBoost}
      onCollisionExit={resetBoostPad}
    >
      <CuboidCollider args={[1, 0.05, 1]} />
      <mesh receiveShadow>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.8} />
      </mesh>
      <group position={[0, 0.08, 0]} rotation={[0, angle, 0]}>
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry args={[0.25, 0.03, 0.8]} />
          <meshStandardMaterial color="#d9f6ff" emissive="#d9f6ff" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.65]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
          <coneGeometry args={[0.38, 0.08, 3]} />
          <meshStandardMaterial color="#d9f6ff" emissive="#d9f6ff" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </RigidBody>
  );
};
