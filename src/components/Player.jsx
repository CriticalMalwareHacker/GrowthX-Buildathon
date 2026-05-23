import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';

const WALK_SPEED = 6;
const SPRINT_SPEED = 12;
const JUMP_IMPULSE = 8;
const COYOTE_TIME = 0.15;
const JUMP_BUFFER = 0.1;
const FULL_CAPSULE_HALF_HEIGHT = 0.8;
const SLIDE_CAPSULE_HALF_HEIGHT = 0.4;
const CAPSULE_RADIUS = 0.45;
const SLIDE_CAPSULE_RADIUS = 0.3;
const FOOT_OFFSET = 1.22;
const WALL_RUN_TIME = 1.2;
const WALL_RUN_COOLDOWN = 0.5;
const WALL_JUMP_LOCKOUT = 0.9;
const WALL_JUMP_PUSH = 7;
const SLIDE_TIME = 1;
const SLIDE_COOLDOWN = 0.3;
const DASH_TIME = 0.15;
const DASH_COOLDOWN = 2;

export const Player = forwardRef(({ cameraStateRef }, ref) => {
  const bodyRef = useRef(null);
  const visualRef = useRef(null);
  const jumpCountRef = useRef(0);
  const coyoteTimerRef = useRef(0);
  const jumpBufferRef = useRef(0);
  const wasJumpPressedRef = useRef(false);
  const wasSlidePressedRef = useRef(false);
  const wasDashPressedRef = useRef(false);
  const wallRunTimerRef = useRef(0);
  const wallRunCooldownRef = useRef(0);
  const wallJumpLockoutRef = useRef(0);
  const needsJumpReleaseRef = useRef(false);
  const wallNormalRef = useRef(new THREE.Vector3());
  const slideTimerRef = useRef(0);
  const slideCooldownRef = useRef(0);
  const slideDirectionRef = useRef(new THREE.Vector3());
  const slideSpeedRef = useRef(0);
  const dashTimerRef = useRef(0);
  const dashCooldownRef = useRef(0);
  const dashDirectionRef = useRef(new THREE.Vector3());
  const [isSliding, setIsSliding] = useState(false);
  const [, getKeys] = useKeyboardControls();
  const { world, rapier } = useRapier();
  const boostActive = useGameStore((state) => state.boostActive);
  const checkpointPos = useGameStore((state) => state.checkpointPos);

  const vectors = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      move: new THREE.Vector3(),
      horizontalVelocity: new THREE.Vector3(),
      wallTangent: new THREE.Vector3(),
    }),
    [],
  );

  useImperativeHandle(ref, () => ({
    rigidBody: () => bodyRef.current,
    translation: () => bodyRef.current?.translation(),
  }));

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    tickCooldowns(delta);

    const keys = getKeys();
    const velocity = body.linvel();
    const position = body.translation();
    const grounded = isGrounded(world, rapier, position, body);
    const jumpPressed = keys.jump && !wasJumpPressedRef.current;
    const slidePressed = keys.slide && !wasSlidePressedRef.current;
    const dashPressed = keys.dash && !wasDashPressedRef.current;

    wasJumpPressedRef.current = keys.jump;
    wasSlidePressedRef.current = keys.slide;
    wasDashPressedRef.current = keys.dash;
    if (!keys.jump || grounded) needsJumpReleaseRef.current = false;

    updateMovementVectors(keys, cameraStateRef.current.yaw, vectors);

    if (position.y < -10) {
      respawn(body, checkpointPos);
      return;
    }

    updateGroundState(grounded, delta);
    updateJumpBuffer(jumpPressed, delta);

    const speedMultiplier = boostActive ? 1.8 : 1;
    const targetSpeed = (keys.sprint ? SPRINT_SPEED : WALK_SPEED) * speedMultiplier;

    if (dashPressed && dashCooldownRef.current <= 0) {
      startDash(vectors);
    }

    if (dashTimerRef.current > 0) {
      runDash(body, velocity, delta);
      rotateVisual(vectors.move);
      return;
    }

    if (isSliding) {
      runSlide(body, velocity, delta, jumpPressed);
      rotateVisual(slideDirectionRef.current);
      return;
    }

    if (slidePressed && grounded && keys.sprint && slideCooldownRef.current <= 0 && vectors.move.lengthSq() > 0) {
      startSlide(velocity, vectors.move);
      runSlide(body, velocity, delta, jumpPressed);
      rotateVisual(slideDirectionRef.current);
      return;
    }

    const wallHit = findRunnableWall(world, rapier, position, body, vectors);
    if (runWallSystem(body, velocity, delta, grounded, keys, wallHit, speedMultiplier, jumpPressed)) {
      rotateVisual(vectors.move);
      return;
    }

    body.setLinvel(
      {
        x: vectors.move.x * targetSpeed,
        y: velocity.y,
        z: vectors.move.z * targetSpeed,
      },
      true,
    );

    const canUseCoyoteJump = coyoteTimerRef.current > 0;
    const canDoubleJump = jumpCountRef.current < 2;
    if (jumpBufferRef.current > 0 && (canUseCoyoteJump || canDoubleJump)) {
      body.setLinvel({ x: vectors.move.x * targetSpeed, y: 0, z: vectors.move.z * targetSpeed }, true);
      body.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
      jumpCountRef.current += 1;
      coyoteTimerRef.current = 0;
      jumpBufferRef.current = 0;
    }

    rotateVisual(vectors.move);
  });

  const tickCooldowns = (delta) => {
    wallRunCooldownRef.current = Math.max(0, wallRunCooldownRef.current - delta);
    wallJumpLockoutRef.current = Math.max(0, wallJumpLockoutRef.current - delta);
    slideCooldownRef.current = Math.max(0, slideCooldownRef.current - delta);
    dashCooldownRef.current = Math.max(0, dashCooldownRef.current - delta);
  };

  const updateGroundState = (grounded, delta) => {
    if (grounded) {
      coyoteTimerRef.current = COYOTE_TIME;
      jumpCountRef.current = 0;
      wallRunTimerRef.current = 0;
    } else {
      coyoteTimerRef.current = Math.max(0, coyoteTimerRef.current - delta);
    }
  };

  const updateJumpBuffer = (jumpPressed, delta) => {
    if (jumpPressed) jumpBufferRef.current = JUMP_BUFFER;
    else jumpBufferRef.current = Math.max(0, jumpBufferRef.current - delta);
  };

  const startDash = (vectorsRef) => {
    dashDirectionRef.current.copy(vectorsRef.move.lengthSq() > 0 ? vectorsRef.move : vectorsRef.forward.clone().multiplyScalar(-1));
    dashDirectionRef.current.normalize();
    dashTimerRef.current = DASH_TIME;
    dashCooldownRef.current = DASH_COOLDOWN;
  };

  const runDash = (body, velocity, delta) => {
    const dashSpeed = 5 / DASH_TIME;
    body.setLinvel(
      {
        x: dashDirectionRef.current.x * dashSpeed,
        y: velocity.y,
        z: dashDirectionRef.current.z * dashSpeed,
      },
      true,
    );
    dashTimerRef.current = Math.max(0, dashTimerRef.current - delta);
  };

  const startSlide = (velocity, moveDirection) => {
    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    slideDirectionRef.current.copy(moveDirection).normalize();
    slideSpeedRef.current = Math.max(horizontalSpeed, SPRINT_SPEED) * 1.2;
    slideTimerRef.current = SLIDE_TIME;
    slideCooldownRef.current = SLIDE_COOLDOWN;
    setIsSliding(true);
  };

  const runSlide = (body, velocity, delta, jumpPressed) => {
    if (jumpPressed) {
      endSlide();
      body.setLinvel({ x: slideDirectionRef.current.x * SPRINT_SPEED, y: 0, z: slideDirectionRef.current.z * SPRINT_SPEED }, true);
      body.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
      jumpBufferRef.current = 0;
      return;
    }

    body.setLinvel(
      {
        x: slideDirectionRef.current.x * slideSpeedRef.current,
        y: velocity.y,
        z: slideDirectionRef.current.z * slideSpeedRef.current,
      },
      true,
    );
    slideTimerRef.current = Math.max(0, slideTimerRef.current - delta);
    if (slideTimerRef.current === 0) endSlide();
  };

  const endSlide = () => {
    slideTimerRef.current = 0;
    setIsSliding(false);
  };

  const runWallSystem = (body, velocity, delta, grounded, keys, wallHit, speedMultiplier, jumpPressed) => {
    const canWallRun =
      !grounded &&
      keys.sprint &&
      vectors.move.lengthSq() > 0 &&
      wallHit &&
      wallRunCooldownRef.current <= 0 &&
      wallJumpLockoutRef.current <= 0 &&
      !needsJumpReleaseRef.current;

    if (wallRunTimerRef.current <= 0 && canWallRun) {
      wallRunTimerRef.current = WALL_RUN_TIME;
      wallNormalRef.current.copy(wallHit.normal);
    }

    if (wallRunTimerRef.current <= 0) return false;
    if (grounded || !wallHit || !keys.sprint) {
      stopWallRun();
      return false;
    }

    wallNormalRef.current.copy(wallHit.normal);
    vectors.wallTangent.set(-wallNormalRef.current.z, 0, wallNormalRef.current.x).normalize();
    if (vectors.wallTangent.dot(vectors.move) < 0) vectors.wallTangent.multiplyScalar(-1);

    if (jumpPressed) {
      body.setLinvel(
        {
          x: vectors.wallTangent.x * SPRINT_SPEED + wallNormalRef.current.x * WALL_JUMP_PUSH,
          y: 0,
          z: vectors.wallTangent.z * SPRINT_SPEED + wallNormalRef.current.z * WALL_JUMP_PUSH,
        },
        true,
      );
      body.applyImpulse(
        {
          x: wallNormalRef.current.x * WALL_JUMP_PUSH,
          y: 9,
          z: wallNormalRef.current.z * WALL_JUMP_PUSH,
        },
        true,
      );
      stopWallRun();
      wallJumpLockoutRef.current = WALL_JUMP_LOCKOUT;
      needsJumpReleaseRef.current = true;
      jumpBufferRef.current = 0;
      return true;
    }

    const wallSpeed = SPRINT_SPEED * 1.1 * speedMultiplier;
    body.setLinvel(
      {
        x: vectors.wallTangent.x * wallSpeed,
        y: Math.max(velocity.y, -1.2),
        z: vectors.wallTangent.z * wallSpeed,
      },
      true,
    );
    body.addForce({ x: 0, y: 3, z: 0 }, true);
    wallRunTimerRef.current = Math.max(0, wallRunTimerRef.current - delta);
    if (wallRunTimerRef.current === 0) wallRunCooldownRef.current = WALL_RUN_COOLDOWN;
    return true;
  };

  const stopWallRun = () => {
    wallRunTimerRef.current = 0;
    wallRunCooldownRef.current = WALL_RUN_COOLDOWN;
  };

  const rotateVisual = (moveVector) => {
    if (moveVector.lengthSq() > 0 && visualRef.current) {
      visualRef.current.rotation.y = Math.atan2(moveVector.x, moveVector.z);
    }
    if (visualRef.current) {
      visualRef.current.scale.y += ((isSliding ? 0.5 : 1) - visualRef.current.scale.y) * 0.35;
    }
  };

  return (
    <RigidBody
      ref={bodyRef}
      name="player"
      type="dynamic"
      position={[0, 3, 0]}
      enabledRotations={[false, false, false]}
      gravityScale={2.5}
      colliders={false}
      canSleep={false}
    >
      <CapsuleCollider
        args={[isSliding ? SLIDE_CAPSULE_HALF_HEIGHT : FULL_CAPSULE_HALF_HEIGHT, isSliding ? SLIDE_CAPSULE_RADIUS : CAPSULE_RADIUS]}
        position={[0, isSliding ? -0.55 : 0, 0]}
      />
      <mesh ref={visualRef} castShadow>
        <capsuleGeometry args={[CAPSULE_RADIUS, FULL_CAPSULE_HALF_HEIGHT * 2, 8, 16]} />
        <meshStandardMaterial color="#2f6fed" />
      </mesh>
    </RigidBody>
  );
});

Player.displayName = 'Player';

const updateMovementVectors = (keys, yaw, vectors) => {
  vectors.forward.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  vectors.right.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
  vectors.move.set(0, 0, 0);

  if (keys.forward) vectors.move.sub(vectors.forward);
  if (keys.backward) vectors.move.add(vectors.forward);
  if (keys.left) vectors.move.sub(vectors.right);
  if (keys.right) vectors.move.add(vectors.right);
  if (vectors.move.lengthSq() > 0) vectors.move.normalize();
};

const respawn = (body, checkpointPos) => {
  body.setTranslation({ x: checkpointPos[0], y: checkpointPos[1], z: checkpointPos[2] }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
};

const isGrounded = (world, rapier, position, body) => {
  const ray = new rapier.Ray(
    { x: position.x, y: position.y - FOOT_OFFSET, z: position.z },
    { x: 0, y: -1, z: 0 },
  );
  return world.castRay(ray, 0.25, true, undefined, undefined, undefined, body) !== null;
};

const findRunnableWall = (world, rapier, position, body, vectors) => {
  const directions = [vectors.move, vectors.right, vectors.right.clone().multiplyScalar(-1)];

  for (const direction of directions) {
    if (direction.lengthSq() === 0) continue;
    const ray = new rapier.Ray({ x: position.x, y: position.y, z: position.z }, direction);
    const hit = world.castRayAndGetNormal(ray, 0.7, true, undefined, undefined, undefined, body);
    if (!hit || Math.abs(hit.normal.y) > 0.25) continue;

    const normal = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
    if (vectors.move.dot(normal) < -0.1) return { normal };
  }

  return null;
};
