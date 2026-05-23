# Phase 3 — Levels & Obstacles
**Time budget:** 2:15 → 3:15 (one hour)  
**Goal:** All 3 levels fully playable end-to-end. Timer running. Death and respawn working. Main menu, level select, and transitions working.  
**Rule:** Build with data arrays, not hardcoded JSX. Let the AI generate level configs — you just describe what you want.

---

## What "Done" Looks Like

- [ ] Main menu renders on first load (gameStatus === "menu")
- [ ] Level 1 completable from start to end portal
- [ ] Level 2 completable with lasers, disappearing tiles, slide tunnel
- [ ] Level 3 completable with rising lava, dash gap, multi-laser room
- [ ] Timer counts down during play
- [ ] Dying respawns at last checkpoint
- [ ] Reaching the end portal shows a level complete screen
- [ ] Level 2 unlocks after Level 1 is beaten
- [ ] Level 3 unlocks after Level 2 is beaten
- [ ] Player can return to menu from death screen and level complete screen

---

## Step 1 — Extend the Zustand Store for Menu & Navigation

Add these fields to `useGameStore.js` before building any screens:

```js
// Add to the store shape:

gameStatus: "menu",   // NEW DEFAULT — was "playing". Values: "menu" | "playing" | "dead" | "levelComplete"

unlockedLevels: [0],  // Only Level 1 unlocked at start
bestTimes: [null, null, null],   // Best completion time per level (seconds remaining)
bestMedals: [null, null, null],  // "gold" | "silver" | "bronze" | null

deathCount: 0,
incrementDeaths: () => set(s => ({ deathCount: s.deathCount + 1 })),

playerSpeed: 0,
setPlayerSpeed: (speed) => set({ playerSpeed: speed }),

goToMenu: () => set({ gameStatus: "menu" }),

// Update levelComplete to also unlock next level and save best time:
levelComplete: () => set(s => {
  const idx = s.currentLevel;
  const nextIdx = idx + 1;
  const unlocked = s.unlockedLevels.includes(nextIdx)
    ? s.unlockedLevels
    : [...s.unlockedLevels, nextIdx];
  
  const medal = getMedalForTime(s.timeRemaining, levels[idx].targetTimes);
  const prevBest = s.bestTimes[idx];
  const newBestTimes = [...s.bestTimes];
  const newBestMedals = [...s.bestMedals];
  
  if (prevBest === null || s.timeRemaining > prevBest) {
    newBestTimes[idx] = s.timeRemaining;
    newBestMedals[idx] = medal;
  }
  
  return {
    gameStatus: "levelComplete",
    timerActive: false,
    unlockedLevels: unlocked,
    bestTimes: newBestTimes,
    bestMedals: newBestMedals,
  };
}),

// startLevel also resets death count:
startLevel: (index) => set({
  gameStatus: "playing",
  currentLevel: index,
  timeRemaining: [180, 150, 120][index],
  timerActive: true,
  deathCount: 0,
  checkpointPos: levels[index].spawnPos,
}),
```

Helper (define outside the store):
```js
const getMedalForTime = (timeRemaining, targetTimes) => {
  if (timeRemaining >= targetTimes.gold)   return "gold";
  if (timeRemaining >= targetTimes.silver) return "silver";
  if (timeRemaining >= targetTimes.bronze) return "bronze";
  return null;
};
```

---

## Step 2 — Data-Driven Level Architecture

Do this before building any level content.

```
Create a Level.jsx component that reads a level config object and renders all entities.

The config shape:

{
  platforms: [
    { type: "static",       pos, size }
    { type: "linear",       pos, size, range, speed, axis }
    { type: "disappearing", pos, size, onTime, offTime }
    { type: "falling",      pos, size, delay }
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

App.jsx renders:
- gameStatus === "menu"          → <MainMenu />
- gameStatus === "playing"       → <Canvas><Level config={levels[currentLevel]} /></Canvas>
- gameStatus === "dead"          → <Canvas + game still rendered> + <DeathScreen /> overlay
- gameStatus === "levelComplete" → <Canvas + game still rendered> + <LevelComplete /> overlay
```

---

## Step 3 — Platform Component (all 4 types)

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
- If isFake: true — render the mesh but never add a CuboidCollider (player falls through)
- Use a useEffect or useFrame timer

Falling:
- RigidBody type="fixed" until player lands on it
- onCollisionEnter: start a delay timer
- After delay: switch to RigidBody type="dynamic" (it falls)
- Reset after 3 sec: teleport back and switch to "fixed" again
```

---

## Step 4 — Laser Component

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
- On player collision: call playerDied() + incrementDeaths() from store, respawn player at checkpoint

Config example:
{ pos: [30, 2, 0], axis: "y", rotSpeed: 0.4, onTime: 1.5, offTime: 2, warningTime: 0.4 }
```

---

## Step 5 — Lava Component

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
- onCollisionEnter with player → call playerDied() + incrementDeaths() from store

Level 1 and 2: lava.rising = false, lava.startY = -6 (static death floor)
Level 3: lava.rising = true, lava.startY = -10, riseSpeed = 0.3, riseSpeedFinal = 0.6
```

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
    { type: "static",  pos: [0,   1,  -38],  size: [6,  0.5, 6]  },
    { type: "static",  pos: [0,   4,  -48],  size: [4,  0.5, 4]  },
    { type: "static",  pos: [0,   7,  -56],  size: [4,  0.5, 4]  },
    { type: "static",  pos: [0,  10,  -64],  size: [6,  0.5, 6]  },
    { type: "static",  pos: [0,  10,  -76],  size: [12, 0.5, 4]  },
    { type: "static",  pos: [0,  10,  -88],  size: [6,  0.5, 6]  },
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
    { type: "static",       pos: [0,   1,  -16],  size: [6,  0.5, 6]  },
    { type: "static",       pos: [0,   1,  -28],  size: [8,  0.5, 8]  },
    { type: "disappearing", pos: [0,   1,  -42],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [4,   1,  -46],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [-4,  1,  -50],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [4,   1,  -54],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [-4,  1,  -58],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "disappearing", pos: [0,   1,  -62],  size: [2.5, 0.5, 2.5], onTime: 2, offTime: 1.5 },
    { type: "static",       pos: [0,   1,  -70],  size: [6,  0.5, 6]  },
    { type: "static",       pos: [0,   1,  -80],  size: [8,  0.5, 5]  },
    { type: "static",       pos: [0,   1,  -92],  size: [6,  0.5, 6]  },
    { type: "static",       pos: [0,   4, -100],  size: [6,  0.5, 6]  },
  ],
  slideTunnel: { pos: [0, 2.6, -80], size: [8, 0.5, 5] },
  wallRunWalls: [
    { pos: [4,  3,  -8],  size: [0.5, 6, 8] },
    { pos: [-4, 3,  -8],  size: [0.5, 6, 8] },
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
    { type: "static",       pos: [0,   4,  -32],  size: [6, 0.5, 6]   },
    { type: "disappearing", pos: [0,   4,  -44],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [3,   4,  -48],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [-3,  4,  -52],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [3,   4,  -44],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2, isFake: true },
    { type: "disappearing", pos: [-3,  4,  -52],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2, isFake: true },
    { type: "disappearing", pos: [0,   4,  -56],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [3,   4,  -60],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "disappearing", pos: [-3,  4,  -64],  size: [2, 0.5, 2],  onTime: 1.2, offTime: 1.2 },
    { type: "static",       pos: [0,   4,  -72],  size: [6, 0.5, 6]   },
    { type: "static",       pos: [0,   4,  -94],  size: [6, 0.5, 6]   },
    { type: "falling",      pos: [0,   4, -104],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -110],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -116],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -122],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "falling",      pos: [0,   4, -128],  size: [3, 0.5, 3],  delay: 0.3 },
    { type: "static",       pos: [0,   8, -136],  size: [6, 0.5, 6]   },
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
    riseAccelAfterCheckpoint: 1,
  },
}
```

---

## Step 9 — Placeholder Menu Screen (functional, unstyled)

Build this now so navigation works end-to-end. Phase 4 replaces it with the full cyberpunk UI.

```
Create src/ui/MainMenu.jsx — functional placeholder only.

Show when gameStatus === "menu".

Layout (plain HTML, no styling needed yet):
- Title: "VEGA PARKOUR"
- Three level buttons in a row
  - Level 1: always clickable → calls startLevel(0)
  - Level 2: only clickable if unlockedLevels.includes(1) — else show "LOCKED"
  - Level 3: only clickable if unlockedLevels.includes(2) — else show "LOCKED"
- Under each unlocked level: show bestTimes[idx] if not null (format MM:SS)
- Controls hint at the bottom (plain text)

Wire it into App.jsx:
  if (gameStatus === "menu") return <MainMenu />;
```

---

## Step 10 — Level Transitions & Full Navigation Flow

```
Wire up all transitions in App.jsx:

GAME STATUS FLOW:
  "menu"          → user clicks level card → startLevel(n) → "playing"
  "playing"       → end portal triggered   → levelComplete() → "levelComplete"
  "playing"       → timer hits 0           → playerDied() + incrementDeaths() → "dead"
  "playing"       → player falls/laser     → playerDied() + incrementDeaths() → "dead"
  "dead"          → Retry button           → startLevel(currentLevel) → "playing"
  "dead"          → Level Select button    → goToMenu() → "menu"
  "levelComplete" → Next Level button      → startLevel(currentLevel + 1) → "playing"
  "levelComplete" → Retry button           → startLevel(currentLevel) → "playing"
  "levelComplete" → Menu button            → goToMenu() → "menu"
  "levelComplete" → last level complete    → show "YOU WIN" + Menu button only

PLACEHOLDER OVERLAYS (Phase 4 replaces these with cyberpunk UI):
  Dead overlay: plain div, "YOU DIED", "RETRY" button, "MENU" button
  Level complete overlay: plain div, "LEVEL COMPLETE", score, "NEXT LEVEL", "RETRY", "MENU"

TIMER in App.jsx useFrame:
  if (timerActive && timeRemaining > 0) tickTimer(delta)
  if (timerActive && timeRemaining <= 0) { playerDied(); incrementDeaths(); }

Keep the Canvas always mounted when gameStatus is "playing", "dead", or "levelComplete".
Only unmount Canvas when gameStatus is "menu" (avoids WebGL context loss).
```

---

## Phase 3 Complete Checklist

| Test | Pass? |
|---|---|
| Main menu appears on first load | |
| Clicking Level 1 starts the game | |
| Level 2 and 3 show as locked until beaten | |
| Level 1 playable start to finish | |
| Moving platforms move smoothly (no jitter) | |
| Jump pads launch player to the right height | |
| Timer counts down and triggers death at zero | |
| Checkpoints save position correctly | |
| Dying respawns at last checkpoint | |
| Death overlay shows with Retry + Menu buttons | |
| Retry restarts the current level | |
| Menu button from death screen returns to main menu | |
| End portal triggers level complete | |
| Level complete shows score and Retry / Next Level / Menu | |
| Level 2 unlocks after beating Level 1 | |
| Menu shows Level 2 as unlocked after it's beaten | |
| Best time saves and shows on menu card | |
| Lasers kill player on contact | |
| Laser warning glow fires 0.4 sec before activating | |
| Disappearing tiles flash before vanishing | |
| Level 3 lava starts rising immediately | |
| Lava accelerates after Checkpoint 2 in Level 3 | |
| Falling platforms drop after player steps on them | |
| Fake tiles in Level 3 have no collider (player falls through) | |
| Dash gap in Level 3 requires air dash to cross | |
| All 3 levels completable end-to-end | |

---

## Common Bugs at This Stage

**Main menu mounts but clicking a level card does nothing**  
→ Make sure `startLevel` in the store is updating `gameStatus` to `"playing"`. Check App.jsx is reading `gameStatus` reactively from the store.

**Canvas re-mounts every time you go to menu and back**  
→ Conditionally render a wrapper but keep Canvas mounted for "playing" | "dead" | "levelComplete". Only swap to `<MainMenu />` for "menu".

**Moving platforms launch the player into the air**  
→ The kinematic platform isn't transferring velocity to the player. Use `onCollisionStay` to match player velocity to platform velocity while standing on it.

**Disappearing tiles don't restore**  
→ You disabled the RigidBody but didn't re-enable it. Use `rapier.world.getRigidBody(handle).setEnabled(true)`.

**Lava rises but doesn't kill the player**  
→ The lava's RigidBody is moving via `setNextKinematicTranslation` but the collider position lags one frame. Check that you're using `kinematicPosition` not `kinematicVelocity`.

**Level 3 fake tiles are invisible**  
→ They need to be visible but skip the `<CuboidCollider>`. Add slightly lower opacity (0.6) as a visual tell.

**End portal keeps triggering after level complete**  
→ Add a `hasTriggered` ref to EndPortal — same pattern as BoostPad.

**goToMenu from death screen doesn't work**  
→ Make sure `goToMenu()` sets `gameStatus: "menu"` and also sets `timerActive: false`. Otherwise the timer keeps ticking on the menu screen.

**bestTimes shows NaN on menu**  
→ `timeRemaining` may be a float. Wrap it in `Math.floor()` before storing.

---

*Phase 3 of 4 — VEGA Parkour*
