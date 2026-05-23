import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

const axisIndex = { x: 0, y: 1, z: 2 };

export const Platform = ({ config }) => {
  if (config.type === 'linear') return <LinearPlatform config={config} />;
  if (config.type === 'disappearing') return <DisappearingPlatform config={config} />;
  if (config.type === 'falling') return <FallingPlatform config={config} />;
  return <StaticPlatform config={config} />;
};

const StaticPlatform = ({ config }) => (
  <RigidBody type="fixed" position={config.pos} colliders={false}>
    <CuboidCollider args={halfSize(config.size)} />
    <PlatformMesh config={config} />
  </RigidBody>
);

const LinearPlatform = ({ config }) => {
  const bodyRef = useRef(null);
  const directionRef = useRef(1);
  const pauseRef = useRef(0);
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    if (pauseRef.current > 0) {
      pauseRef.current = Math.max(0, pauseRef.current - delta);
    } else {
      offsetRef.current += directionRef.current * config.speed * delta;
      if (Math.abs(offsetRef.current) >= config.range) {
        offsetRef.current = Math.sign(offsetRef.current) * config.range;
        directionRef.current *= -1;
        pauseRef.current = 0.5;
      }
    }

    const next = [...config.pos];
    next[axisIndex[config.axis] ?? 0] += offsetRef.current;
    bodyRef.current.setNextKinematicTranslation({ x: next[0], y: next[1], z: next[2] });
  });

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={config.pos} colliders={false}>
      <CuboidCollider args={halfSize(config.size)} />
      <PlatformMesh config={config} color="#8f98a3" />
    </RigidBody>
  );
};

const DisappearingPlatform = ({ config }) => {
  const colliderRef = useRef(null);
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const timerRef = useRef(config.phaseOffset ?? 0);
  const totalTime = config.onTime + config.offTime;

  useFrame((_, delta) => {
    timerRef.current = (timerRef.current + delta) % totalTime;
    const enabled = timerRef.current < config.onTime;
    const warning = enabled && config.onTime - timerRef.current < 0.5;

    if (colliderRef.current) colliderRef.current.setEnabled(enabled);
    if (meshRef.current) meshRef.current.visible = enabled || config.isFake;
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = warning ? 0.75 : 0;
      materialRef.current.emissive.set(warning ? '#ffffff' : '#000000');
    }
  });

  return (
    <RigidBody type="fixed" position={config.pos} colliders={false}>
      {!config.isFake && <CuboidCollider ref={colliderRef} args={halfSize(config.size)} />}
      <mesh ref={meshRef} receiveShadow>
        <boxGeometry args={config.size} />
        <meshStandardMaterial
          ref={materialRef}
          color={config.isFake ? '#737373' : '#9a8f6a'}
          emissive="#000000"
          emissiveIntensity={0}
          transparent={config.isFake}
          opacity={config.isFake ? 0.6 : 1}
        />
      </mesh>
    </RigidBody>
  );
};

const FallingPlatform = ({ config }) => {
  const bodyRef = useRef(null);
  const [bodyType, setBodyType] = useState('fixed');
  const fallingTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  useFrame((_, delta) => {
    if (fallingTimerRef.current !== null) {
      fallingTimerRef.current -= delta;
      if (fallingTimerRef.current <= 0) {
        fallingTimerRef.current = null;
        resetTimerRef.current = 3;
        setBodyType('dynamic');
      }
    }

    if (resetTimerRef.current !== null) {
      resetTimerRef.current -= delta;
      if (resetTimerRef.current <= 0 && bodyRef.current) {
        resetTimerRef.current = null;
        setBodyType('fixed');
        bodyRef.current.setTranslation({ x: config.pos[0], y: config.pos[1], z: config.pos[2] }, true);
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  });

  const startFalling = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player' && bodyType === 'fixed' && fallingTimerRef.current === null) {
      fallingTimerRef.current = config.delay ?? 0.3;
    }
  };

  return (
    <RigidBody ref={bodyRef} key={bodyType} type={bodyType} position={config.pos} colliders={false} onCollisionEnter={startFalling}>
      <CuboidCollider args={halfSize(config.size)} />
      <PlatformMesh config={config} color="#9c7d72" />
    </RigidBody>
  );
};

const PlatformMesh = ({ config, color = '#7d7d7d' }) => (
  <mesh receiveShadow>
    <boxGeometry args={config.size} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const halfSize = (size) => size.map((value) => value / 2);
