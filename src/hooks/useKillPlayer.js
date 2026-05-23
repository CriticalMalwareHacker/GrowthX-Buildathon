import { useGameStore } from '../store/useGameStore';

export const useKillPlayer = () => {
  const playerDied = useGameStore((state) => state.playerDied);
  const incrementDeaths = useGameStore((state) => state.incrementDeaths);

  return ({ other }) => {
    if (other.rigidBodyObject?.name !== 'player') return;
    const checkpointPos = useGameStore.getState().checkpointPos;
    other.rigidBody.setTranslation({ x: checkpointPos[0], y: checkpointPos[1], z: checkpointPos[2] }, true);
    other.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    incrementDeaths();
    playerDied();
  };
};
