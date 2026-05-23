import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';

const OFFSET = new THREE.Vector3(0, 2.5, 5);
const LOOK_OFFSET = new THREE.Vector3(0, 1.2, 0);

export const PlayerCamera = ({ playerRef, cameraStateRef }) => {
  const { camera, gl } = useThree();
  const pitchRef = useRef(-0.15);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const rotatedOffset = useMemo(() => new THREE.Vector3(), []);
  const shakeOffset = useMemo(() => new THREE.Vector3(), []);
  const currentFovRef = useRef(85);
  const shakeIntensityRef = useRef(0);
  const boostActive = useGameStore((state) => state.boostActive);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const consumeCameraShake = useGameStore((state) => state.consumeCameraShake);

  useEffect(() => {
    const canvas = gl.domElement;
    const requestPointerLock = () => {
      if (useGameStore.getState().gameStatus === 'playing') canvas.requestPointerLock();
    };
    const handleMouseMove = (event) => {
      if (document.pointerLockElement !== canvas) return;
      cameraStateRef.current.yaw -= event.movementX * 0.0025;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - event.movementY * 0.002,
        -0.75,
        0.45,
      );
    };

    canvas.addEventListener('click', requestPointerLock);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('click', requestPointerLock);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cameraStateRef, gl]);

  useEffect(() => {
    if (gameStatus !== 'playing' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [gameStatus]);

  useFrame(() => {
    const playerPosition = playerRef.current?.translation();
    if (!playerPosition) return;

    const requestedShake = consumeCameraShake();
    if (requestedShake > 0) shakeIntensityRef.current = Math.max(shakeIntensityRef.current, requestedShake);

    const targetFov = boostActive ? 95 : 85;
    currentFovRef.current = THREE.MathUtils.lerp(currentFovRef.current, targetFov, boostActive ? 0.16 : 0.1);
    camera.setFocalLength(fovToFocalLength(camera, currentFovRef.current));
    camera.updateProjectionMatrix();

    target.set(playerPosition.x, playerPosition.y, playerPosition.z);
    rotatedOffset.copy(OFFSET).applyEuler(new THREE.Euler(pitchRef.current, cameraStateRef.current.yaw, 0, 'YXZ'));
    cameraTarget.copy(target).add(rotatedOffset);

    shakeOffset.set(0, 0, 0);
    if (shakeIntensityRef.current > 0.001) {
      shakeOffset.set(
        (Math.random() - 0.5) * shakeIntensityRef.current,
        (Math.random() - 0.5) * shakeIntensityRef.current,
        0,
      );
      shakeIntensityRef.current *= boostActive ? 0.88 : 0.82;
    } else {
      shakeIntensityRef.current = 0;
    }
    camera.position.lerp(cameraTarget.add(shakeOffset), 0.1);
    camera.lookAt(target.add(LOOK_OFFSET));
  });

  return null;
};

const fovToFocalLength = (camera, fov) => {
  return 0.5 * camera.getFilmHeight() / Math.tan(THREE.MathUtils.degToRad(fov) * 0.5);
};
