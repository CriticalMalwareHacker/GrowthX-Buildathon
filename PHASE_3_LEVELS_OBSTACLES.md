# Phase 3 — Levels & Obstacles
**Time budget:** 2:15 → 3:15 (one hour)  
**Goal:** All 3 levels fully playable end-to-end. Timer running. Death and respawn working. Level select and transitions working.  
**Rule:** Build with data arrays, not hardcoded JSX. Let the AI generate level configs — you just describe what you want.

---

## What "Done" Looks Like

- [ ] Level 1 completable from start to end portal
- [ ] Level 2 completable with lasers, disappearing tiles, slide tunnel
- [ ] Level 3 completable with rising lava, dash gap, multi-laser room
- [ ] Timer counts down during play
- [ ] Dying respawns at last checkpoint
- [ ] Reaching the end portal shows a level complete screen
- [ ] Level 2 unlocks after Level 1 is beaten
- [ ] Level 3 unlocks after Level 2 is beaten

---

## Step 1 — Data-Driven Level Architecture

Do this before building any level content. This is the most important structural decision in the whole project.

```
Create a Level.jsx component that reads a level config object and renders all entities.

The config shape:

{
  platforms: [
    { type: "static",       pos, size }
    { type: "linear",       pos, size, range, speed, axis }      // moves back and forth
    { type: "disappearing", pos, size, onTime, offTime }         // flashes then vanishes
    { type: "falling",      pos, size, delay }                   // falls after player contact
  ],
  jumpPads:    [{ pos, direction? }],
  boostPads:   [{ pos }],
  lasers:      [{ pos, axis, rotSpeed, onTime, offTime, warningTime }],
  checkpoints: [{ pos }],
  orbs:        [{ pos }],
  endPortal:   { pos },
  lava:        { startY, rising, riseSpeed, riseSpeedFinal, riseAccelAfterCheckpoint? },
  timer:       180,
  targetTimes: { gold, silver, bronze },
  spawnPos:    [0, 2, 0],
}

Level.jsx maps over each array and renders the correct component.
It receives a single prop: <Level config={levelConfig} />

App.jsx renders <Level config={levels[currentLevel]} /> based on the store.
```

---

## Step 2 — Platform Component (all 4 types)

```
Expand Platform.jsx to handle all 4 types from the config.

Static:
- RigidBody type="fixed"
- CuboidCollider matching size
- Standard grey meshStandardMaterial

Linear:
- RigidBody type="kinematicPosition"
- useFrame: move between pos +range and pos -range along the given axis
- Pause 0.5 sec at each end before reversing
- Use rigidBodyRef.current.setNextKinematicTranslation(vec) — NOT setState

Disappearing:
- RigidBody type="fixed" with an "enabled" state
- Visible for onTime seconds, then disable collider and hide mesh for offTime seconds
- Flash the material white 0.5 sec before disappearing (increase emissive intensity)
- Use a useEffect or useFrame timer

Falling:
- RigidBody type="fixed" until player lands on it
- onCollisionEnter: start a delay timer
- After delay: switch to RigidBody type="dynamic" (it falls)
- Reset after 3 sec: teleport back and switch to "fixed" again
```

---

## Step 3 — Laser Component

```
Create Laser.jsx.

Visual:
- Thin cylinder (radius 0.05, height matches the gap it spans)
- Red emissive material (#ff2200)
- Warning state: pulse emissive intensity between 0.2 and 1.0 over warningTime seconds
- Active state: full emissive, collider enabled
- Off state: no emissive, collider disabled

Behaviour:
- Cycle: warningTime (pulse) → onTime (active, kills player) → offTime (dormant) → repeat
- Rotate around its Y axis at rotSpeed rad/sec using setNextKinematicRotation
- On player collision: call playerDied() from store, respawn player at checkpoint

Config example:
{ pos: [30, 2, 0], axis: "y", rotSpeed: 0.4, onTime: 1.5, offTime: 2, warningTime: 0.4 }
```

---

## Step 4 — Lava Component

```
Create Lava.jsx.

Visual:
- Large flat plane [100, 0.2, 100]
- Orange emissive material (#ff6600), emissiveIntensity: 0.8
- Slow Y-axis position oscillation (±0.05 units) to simulate liquid movement

Rising behaviour (Level 3 only):
- Track current Y position in a useRef
- In useFrame: if lava.rising === true, increment Y by riseSpeed * delta
- After player hits Checkpoint 2 in Level 3: increase riseSpeed to riseSpeedFinal (0.6)
- Use setNextKinematicTranslation to move the RigidBody

Death on contact:
- onCollisionEnter with player → call playerDied() from store

Level 1 and 2: lava.rising = false, lava.startY = -6 (static death floor)
Level 3: lava.rising = true, lava.startY = -10, riseSpeed = 0.3, riseSpeedFinal = 0.6
```

---

## Step 5 — Level Configs

Feed the AI your level structure description and let it generate the coordinate arrays. Use this prompt pattern:

```
Using this Platform config schema:
{ type, pos, size, range?, speed?, axis?, onTime?, offTime?, delay? }

Generate the level1 config object for this layout:
- Spawn at [0, 1, 0] on a large platform [12, 0.5, 8]
- 3 linear moving platforms crossing a gap (X axis movement, range 3, speed 1.5)
  spaced 6 units apart starting at Z = -12
- Checkpoint 1 on a platform at Z = -28
- 3 jump pads leading up a vertical climb (each 8 units forward and 3 units higher)
- Checkpoint 2 at the top of the climb at approximately [0, 10, -50]
- Speed boost pad into a final sprint corridor
- End portal at Z = -80, Y = 10
- Lava at Y = -6, static
- Timer: 180, targetTimes: { gold: 60, silver: 90, bronze: 150 }
```

Do the same for Level 2 and Level 3 with their respective layouts from the GDD.

---

## Step 6 — Level 1 Config

```js
// src/levels/level1.js
export const level1 = {
  spawnPos: [0, 2, 0],
  timer: 180,
  targetTimes: { gold: 60, silver: 90, bronze: 150 },
  platforms: [
    { type: "static",  pos: [0,   1,   0],   size: [12, 0.5, 8]  },
    { type: "static",  pos: [0,   1,  -10],  size: [4,  0.5, 4]  },
    { type: "linear",  pos: [0,   1,  -18],  size: [3,  0.5, 3],  range: 3, speed: 1.5, axis: "x" },
    { type: "linear",  pos: [0,   1,  -24],  size: [3,  0.5, 3],  range: 3, speed: 2,   axis: "x" },
    { type: "linear",  pos: [0,   1,  -30],  size: [3,  0.5, 3],  range: 4, speed: 1.5, axis: "x" },
    { type: "static",  pos: [0,   1,  -38],  size: [6,  0.5, 6]  },  // checkpoint 1
    { type: "static",  pos: [0,   4,  -48],  size: [4,  0.5, 4]  },
    { type: "static",  pos: [0,   7,  -56],  size: [4,  0.5, 4]  },
    { type: "static",  pos: [0,  10,  -64],  size: [6,  0.5, 6]  },  // checkpoint 2
    { type: "static",  pos: [0,  10,  -76],  size: [12, 0.5, 4]  },  // sprint corridor
    { type: "static",  pos: [0,  10,  -88],  size: [6,  0.5, 6]  },  // end
  ],
  jumpPads:    [{ pos: [0, 1.3, -46] }, { pos: [0, 4.3, -54] }, { pos: [0, 7.3, -62] }],
  boostPads:   [{ pos: [0, 1.3, -6] }, { pos: [0, 10.3, -70] }],
  checkpoints: [{ pos: [0, 2, -38] }, { pos: [0, 11, -64] }],
  orbs:        [{ pos: [3, 2, -14] }, { pos: [-3, 2, -24] }, { pos: [0, 8, -52] },
                { pos: [0, 11, -60] }, { pos: [4, 11, -72] }],
  lasers:      [],
  endPortal:   { pos: [0, 11.5, -88] },
  lava:        { startY: -6, rising: false },
}
```

---

## Step 7 — Level 2 Config

```js
// src/levels/level2.js
export const level2 = {
  spawnPos: [0, 2, 0],
  timer: 150,
  targetTimes: { gold: 55, silver: 80, bronze: 130 },
  platforms: [
    { type: "static",       pos: [0,   1,   0],   size: [8,  0.5, 8]  },
    // wall run corridor — two parallel walls handled separately
    { type: "static",       pos: [0,   1,  -16],  size: [6,  0.5, 6]  },  // checkpoint 1
    { type: "static",       pos: [0,   1,  -28],  size: [8,  0.5, 8]  },  // laser room
    { type: "disappearing", pos: [0,   1,  -42],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [4,   1,  -46],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [-4,  1,  -50],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [4,   1,  -54],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [-4,  1,  -58],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [0,   1,  -62],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "static",       pos: [0,   1,  -70],  size: [6,  0.5, 6]  },  // checkpoint 2
    // slide tunnel: a low-ceiling platform requiring a slide
    { type: "static",       pos: [0,   1,  -80],  size: [8,  0.5, 5]  },
    { type: "static",       pos: [0,   1,  -92],  size: [6,  0.5, 6]  },
    { type: "static",       pos: [0,   4,  -100], size: [6,  0.5, 6]  },  // end
  ],
  // slide tunnel ceiling — very low, player must slide to pass
  slideTunnel: { pos: [0, 2.6, -80], size: [8, 0.5, 5] },  // invisible ceiling collider
  wallRunWalls: [
    { pos: [4,  3,  -8],  size: [0.5, 6, 8] },   // right wall
    { pos: [-4, 3,  -8],  size: [0.5, 6, 8] },   // left wall
  ],
  jumpPads:    [{ pos: [0, 1.3, -88] }],
  boostPads:   [{ pos: [0, 1.3, -4] }],
  checkpoints: [{ pos: [0, 2, -16] }, { pos: [0, 2, -70] }],
  orbs:        [{ pos: [0, 3, -10] }, { pos: [2, 2, -44] }, { pos: [-2, 2, -56] },
                { pos: [0, 2, -74] }, { pos: [0, 3, -96] }],
  lasers: [
    { pos: [0, 2, -30], axis: "y", rotSpeed: 0.35, onTime: 1.5, offTime: 2, warningTime: 0.4 },
    { pos: [0, 2, -34], axis: "y", rotSpeed: 0.5,  onTime: 1.5, offTime: 2, warningTime: 0.4 },
    { pos: [0, 2, -38], axis: "y", rotSpeed: 0.4,  onTime: 1.5, offTime: 2, warningTime: 0.4 },
  ],
  endPortal:  { pos: [0, 5.5, -100] },
  lava:       { startY: -6, rising: false },
}
```

---

## Step 8 — Level 3 Config

```js
// src/levels/level3.js
export const level3 = {
  spawnPos: [0, 2, 0],
  timer: 120,
  targetTimes: { gold: 50, silver: 75, bronze: 110 },
  platforms: [
    { type: "static",       pos: [0,   2,   0],   size: [6, 0.5, 6]   },
    { type: "static",       pos: [0,   2,  -12],  size: [3, 0.5, 3]   },
    { type: "static",       pos: [0,   4,  -20],  size: [3, 0.5, 3]   },
    { type: "static",       pos: [0,   4,  -32],  size: [6, 0.5, 6]   },  // checkpoint 1
    { type: "disappearing", pos: [0,   4,  -44],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [3,   4,  -48],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [-3,  4,  -52],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    // fake tiles (same visual, no collider — implemented with isFake: true prop)
    { type: "disappearing", pos: [3,   4,  -44],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2, isFake: true },
    { type: "disappearing", pos: [-3,  4,  -52],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2, isFake: true },
    { type: "disappearing", pos: [0,   4,  -56],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [3,   4,  -60],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [-3,  4,  -64],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "static",       pos: [0,   4,  -72],  size: [6, 0.5, 6]   },  // multi-laser room
    // dash gap: no platform between Z=-82 and Z=-90 (7 unit gap — must dash)
    { type: "static",       pos: [0,   4,  -94],  size: [6, 0.5, 6]   },  // checkpoint 2
    { type: "falling",      pos: [0,   4, -104],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -110],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -116],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -122],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -128],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "static",       pos: [0,   8, -136],  size: [6, 0.5, 6]   },  // end (elevated)
  ],
  jumpPads:    [{ pos: [0, 2.3, -8] }, { pos: [0, 4.3, -132], direction: { x:0, y:14, z:-4 } }],
  boostPads:   [{ pos: [0, 2.3, -4] }],
  checkpoints: [{ pos: [0, 5, -32] }, { pos: [0, 5, -94] }],
  orbs:        [{ pos: [0, 3, -16] }, { pos: [2, 5, -46] }, { pos: [-2, 5, -58] },
                { pos: [0, 5, -76] }, { pos: [0, 6, -130] }],
  lasers: [
    { pos: [0, 5, -74], axis: "y", rotSpeed: 0.5,  onTime: 1.5, offTime: 1.5, warningTime: 0.4 },
    { pos: [0, 5, -78], axis: "x", rotSpeed: 0.35, onTime: 1.5, offTime: 1.5, warningTime: 0.4 },
  ],
  endPortal: { pos: [0, 9.5, -136] },
  lava: {
    startY: -8,
    rising: true,
    riseSpeed: 0.3,
    riseSpeedFinal: 0.6,
    riseAccelAfterCheckpoint: 1,   // index of checkpoint that triggers the speed increase
  },
}
```

---

## Step 9 — Level Transitions

```
Wire up level transitions in App.jsx:

1. When gameStatus === "levelComplete":
   - Show the LevelComplete screen (we'll build the full UI in Phase 4)
   - For now: just show a plain HTML overlay with "Level Complete!" and a "Next Level" button
   - "Next Level" button calls startLevel(currentLevel + 1)
   - If currentLevel === 2 (last level): show "You Win!" instead

2. When gameStatus === "dead":
   - Show a plain "You Died" overlay with a "Retry" button
   - "Retry" calls startLevel(currentLevel) to restart the current level

3. Timer: in useFrame at the App level, if timerActive, call tickTimer() each frame
   - If timeRemaining <= 0: call gameOver()

4. Level select: after beating Level 1, unlock Level 2. After beating Level 2, unlock Level 3.
   - Store unlockedLevels: [0] in Zustand, push the next index on levelComplete

Keep the UI unstyled for now. Just functional. Phase 4 handles styling.
```

---

## Phase 3 Complete Checklist

| Test | Pass? |
|---|---|
| Level 1 playable start to finish | |
| Moving platforms on Level 1 move smoothly (no jitter) | |
| Jump pads launch player to the right height | |
| Timer counts down and triggers game over at zero | |
| Checkpoints save position correctly | |
| Dying respawns at last checkpoint | |
| End portal triggers level complete | |
| Level 2 unlocks after beating Level 1 | |
| Lasers kill player on contact | |
| Laser warning glow fires 0.4 sec before activating | |
| Disappearing tiles flash before vanishing | |
| Level 3 lava starts rising immediately | |
| Lava accelerates after Checkpoint 2 in Level 3 | |
| Falling platforms drop after player steps on them | |
| Fake tiles in Level 3 have no collider (player falls through) | |
| Dash gap in Level 3 requires air dash to cross | |
| All 3 levels completable (even if ugly) | |

---

## Common Bugs at This Stage

**Moving platforms launch the player into the air**  
→ The kinematic platform isn't transferring velocity to the player. Use a `onCollisionStay` to match player velocity to platform velocity while standing on it.

**Disappearing tiles don't restore**  
→ You disabled the RigidBody but didn't re-enable it. Use `rapier.world.getRigidBody(handle).setEnabled(true)`.

**Lava rises but doesn't kill the player**  
→ The lava's RigidBody is moving via setNextKinematicTranslation but the collider position lags one frame. Check that you're using `kinematicPosition` not `kinematicVelocity`.

**Level 3 fake tiles are invisible**  
→ They need to be visible but have `isFake: true` skip the `<CuboidCollider>`. Add a slightly different opacity (0.6) as a visual tell.

**End portal keeps triggering after level complete**  
→ Add a `hasTriggered` ref to EndPortal — same pattern as BoostPad.

---

*Phase 3 of 4 — VEGA Parkour*
