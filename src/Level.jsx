import { BoostPad } from './components/BoostPad';
import { Checkpoint } from './components/Checkpoint';
import { EndPortal } from './components/EndPortal';
import { JumpPad } from './components/JumpPad';
import { Laser } from './components/Laser';
import { Lava } from './components/Lava';
import { Orb } from './components/Orb';
import { Platform } from './components/Platform';

export const Level = ({ config }) => {
  return (
    <>
      {config.platforms.map((platform, index) => (
        <Platform key={`platform-${index}`} config={platform} />
      ))}
      {config.slideTunnel && <Platform config={{ type: 'static', ...config.slideTunnel }} />}
      {config.wallRunWalls?.map((wall, index) => (
        <Platform key={`wall-${index}`} config={{ type: 'static', ...wall }} />
      ))}
      {config.jumpPads.map((pad, index) => (
        <JumpPad key={`jump-${index}`} position={pad.pos} direction={pad.direction} />
      ))}
      {config.boostPads.map((pad, index) => (
        <BoostPad key={`boost-${index}`} position={pad.pos} />
      ))}
      {config.checkpoints.map((checkpoint, index) => (
        <Checkpoint key={`checkpoint-${index}`} position={checkpoint.pos} checkpoint={checkpoint.pos} index={index} />
      ))}
      {config.orbs.map((orb, index) => (
        <Orb key={`orb-${index}`} position={orb.pos} />
      ))}
      {config.lasers.map((laser, index) => (
        <Laser key={`laser-${index}`} config={laser} />
      ))}
      <EndPortal position={config.endPortal.pos} />
      <Lava config={config.lava} />
    </>
  );
};
