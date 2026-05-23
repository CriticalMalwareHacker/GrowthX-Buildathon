import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKillPlayer } from '../hooks/useKillPlayer';

const length = 7;

export const Laser = ({ config }) => {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);
  const angleRef = useRef(0);
  const [phase, setPhase] = useState('warning');
  const [intensity, setIntensity] = useState(0.2);
  const killPlayer = useKillPlayer();
  const cycle = config.warningTime + config.onTime + config.offTime;
  const rotation = useMemo(() => getLaserRotation(config.axis), [config.axis]);
  const colliderArgs = useMemo(() => getColliderArgs(config.axis), [config.axis]);

  useFrame((_, delta) => {
    elapsedRef.current = (elapsedRef.current + delta) % cycle;
    const t = elapsedRef.current;
    const nextPhase = t < config.warningTime ? 'warning' : t < config.warningTime + config.onTime ? 'active' : 'off';
    if (nextPhase !== phase) setPhase(nextPhase);
    setIntensity(nextPhase === 'active' ? 1.3 : nextPhase === 'warning' ? 0.2 + Math.abs(Math.sin(t * 18)) * 0.8 : 0);

    angleRef.current += config.rotSpeed * delta;
    if (bodyRef.current) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angleRef.current, 0));
      bodyRef.current.setNextKinematicRotation(q);
    }
  });

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={config.pos} colliders={false}>
      {phase === 'active' && <CuboidCollider args={colliderArgs} sensor onIntersectionEnter={killPlayer} />}
      <mesh rotation={rotation}>
        <cylinderGeometry args={[0.05, 0.05, length, 16]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={intensity} transparent opacity={phase === 'off' ? 0.2 : 1} />
      </mesh>
    </RigidBody>
  );
};

const getLaserRotation = (axis) => {
  if (axis === 'x') return [0, 0, Math.PI / 2];
  if (axis === 'z') return [Math.PI / 2, 0, 0];
  return [0, 0, 0];
};

const getColliderArgs = (axis) => {
  if (axis === 'x') return [length / 2, 0.08, 0.08];
  if (axis === 'z') return [0.08, 0.08, length / 2];
  return [0.08, length / 2, 0.08];
};
