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
  const currentFovRef = useRef(85);
  const boostActive = useGameStore((state) => state.boostActive);

  useEffect(() => {
    const canvas = gl.domElement;
    const requestPointerLock = () => canvas.requestPointerLock();
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

  useFrame(() => {
    const playerPosition = playerRef.current?.translation();
    if (!playerPosition) return;

    const targetFov = boostActive ? 95 : 85;
    currentFovRef.current = THREE.MathUtils.lerp(currentFovRef.current, targetFov, boostActive ? 0.16 : 0.1);
    camera.setFocalLength(fovToFocalLength(camera, currentFovRef.current));
    camera.updateProjectionMatrix();

    target.set(playerPosition.x, playerPosition.y, playerPosition.z);
    rotatedOffset.copy(OFFSET).applyEuler(new THREE.Euler(pitchRef.current, cameraStateRef.current.yaw, 0, 'YXZ'));
    cameraTarget.copy(target).add(rotatedOffset);

    camera.position.lerp(cameraTarget, 0.1);
    camera.lookAt(target.add(LOOK_OFFSET));
  });

  return null;
};

const fovToFocalLength = (camera, fov) => {
  return 0.5 * camera.getFilmHeight() / Math.tan(THREE.MathUtils.degToRad(fov) * 0.5);
};
