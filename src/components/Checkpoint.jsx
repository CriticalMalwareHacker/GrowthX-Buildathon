import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';

export const Checkpoint = ({ position, checkpoint = position, index = -1 }) => {
  const ringRef = useRef(null);
  const pulseRef = useRef(null);
  const particlesRef = useRef(null);
  const burstTimerRef = useRef(0);
  const activatedRef = useRef(false);
  const [active, setActive] = useState(false);
  const setCheckpoint = useGameStore((state) => state.setCheckpoint);
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, particleIndex) => ({
        id: particleIndex,
        velocity: {
          x: ((particleIndex % 5) - 2) * 1.1,
          y: 1.5 + (particleIndex % 4) * 0.65,
          z: (Math.floor(particleIndex / 2) - 2) * 0.9,
        },
      })),
    [],
  );

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.4;
    if (pulseRef.current && active) {
      const pulse = 1 + ((performance.now() * 0.001) % 1.5) / 1.5 * 0.5;
      pulseRef.current.scale.setScalar(pulse);
      pulseRef.current.material.opacity = 1.5 - pulse;
    }
    if (particlesRef.current && burstTimerRef.current > 0) {
      burstTimerRef.current = Math.max(0, burstTimerRef.current - delta);
      particlesRef.current.children.forEach((particle) => {
        particle.position.x += particle.userData.velocity.x * delta;
        particle.position.y += particle.userData.velocity.y * delta;
        particle.position.z += particle.userData.velocity.z * delta;
        particle.material.opacity = burstTimerRef.current / 0.4;
      });
    }
  });

  const activateCheckpoint = ({ other }) => {
    if (activatedRef.current || other.rigidBodyObject?.name !== 'player') return;
    activatedRef.current = true;
    setActive(true);
    burstTimerRef.current = 0.4;
    setCheckpoint(checkpoint, index);
    playChime();
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
      {active && (
        <mesh ref={pulseRef} castShadow>
          <torusGeometry args={[1.25, 0.04, 12, 48]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} transparent opacity={0.8} />
        </mesh>
      )}
      <group ref={particlesRef}>
        {particles.map((particle) => (
          <mesh
            key={particle.id}
            position={[0, 0, 0]}
            userData={{ velocity: particle.velocity }}
          >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} transparent opacity={0} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
};

const playChime = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};
