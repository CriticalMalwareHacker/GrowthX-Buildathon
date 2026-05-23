import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

export const JumpPad = ({ position, direction }) => {
  const meshRef = useRef(null);
  const bounceRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    bounceRef.current = Math.max(0, bounceRef.current - delta * 5);
    meshRef.current.scale.y += ((bounceRef.current > 0 ? 0.7 : 1) - meshRef.current.scale.y) * 0.25;
  });

  const launchPlayer = ({ other }) => {
    if (other.rigidBodyObject?.name !== 'player') return;
    const impulse = direction
      ? { x: direction[0], y: direction[1], z: direction[2] }
      : { x: 0, y: 22, z: 0 };
    other.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    other.rigidBody.applyImpulse(impulse, true);
    bounceRef.current = 1;
  };

  return (
    <RigidBody name="jumppad" type="fixed" position={position} colliders={false} onCollisionEnter={launchPlayer}>
      <CuboidCollider args={[0.75, 0.1, 0.75]} />
      <mesh ref={meshRef} receiveShadow>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} />
      </mesh>
    </RigidBody>
  );
};
