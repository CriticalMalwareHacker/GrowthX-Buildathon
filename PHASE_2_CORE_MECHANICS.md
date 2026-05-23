# Phase 2 — Core Mechanics
**Time budget:** 1:00 → 2:15 (one hour fifteen minutes)  
**Goal:** All parkour mechanics working. Jump pads, boost pads, wall run, slide, dash. Still no full levels — just a test sandbox to verify each mechanic feels good.  
**Rule:** One mechanic at a time. Test each before adding the next.

---

## What "Done" Looks Like

- [ ] Wall run activates when sprinting into a wall while airborne
- [ ] Slide works on ground, reduces collider height
- [ ] Dash fires in movement direction with a cooldown
- [ ] Jump pad launches player upward on contact
- [ ] Speed boost pad temporarily increases speed + FOV
- [ ] Checkpoints save respawn position when player runs through
- [ ] Zustand store is wired up with timer, score, checkpoint, boost state

---

## Step 1 — Wire Up the Zustand Store

Do this before any mechanic. Everything depends on it.

```
Create src/store/useGameStore.js with this exact shape:

{
  gameStatus: "playing",        // "playing" | "dead" | "levelComplete"
  currentLevel: 0,
  
  timeRemaining: 180,
  timerActive: false,
  tickTimer: () => decrease timeRemaining by delta each frame,
  
  score: 0,
  orbsCollected: 0,
  addOrb: () => increment score by 10 and orbsCollected by 1,

  boostActive: false,
  boostTimeLeft: 0,
  activateBoost: () => set boostActive true, boostTimeLeft 2,
  tickBoost: (delta) => decrease boostTimeLeft by delta, set boostActive false when it hits 0,

  checkpointPos: [0, 2, 0],
  setCheckpoint: (pos) => set checkpointPos to pos,

  startLevel: (index) => set gameStatus "playing", currentLevel index, 
               timeRemaining from [180, 150, 120][index], timerActive true,
  levelComplete: () => set gameStatus "levelComplete", timerActive false,
  playerDied: () => set gameStatus "dead",
}

Use Zustand's create(). Export as useGameStore.
```

---

## Step 2 — Wall Run

```
Add wall run to Player.jsx.

Trigger: Player is airborne AND moving into a wall (wall normal is mostly horizontal).
Detect using Rapier's castRay sideways from the player. If ray hits within 0.6 units and player is not grounded → wall run.

Wall run behaviour:
- Max duration: 1.2 sec (use a useRef timer)
- Reduce gravity effect: apply a small upward force (Y: 3) every frame while wall running
- Speed multiplier: 1.1x the current sprint speed
- Player should run parallel to the wall (project velocity onto wall tangent)
- Wall jump: if Space pressed during wall run, apply impulse Y: 9 + 30% lateral push away from wall

Exit conditions:
- Timer expires
- Player presses jump (triggers wall jump)
- Player moves away from wall
- Player becomes grounded

Cooldown: 0.5 sec after wall run ends before another can start.

Visual: we'll add effects in Phase 4. For now just make the mechanic work correctly.
```

---

## Step 3 — Slide

```
Add slide to Player.jsx.

Trigger: Press C while grounded and moving at sprint speed or faster.

Slide behaviour:
- Boost speed by +20% of current speed at moment of slide start
- Duration: 1.0 sec
- During slide: switch CapsuleCollider to a shorter height (half height: 0.4 instead of 0.8)
- Restore collider size when slide ends
- Cooldown: 0.3 sec

Slide jump: if Space is pressed during a slide, cancel the slide and apply a normal jump impulse.
The collider must restore to full size immediately when slide-jumping.

Do not change the visual mesh yet — just the collider and movement.
```

---

## Step 4 — Dash

```
Add dash to Player.jsx.

Trigger: Press E.

Dash behaviour:
- Distance: 5 units
- Duration: 0.15 sec (very fast — almost instant)
- Direction: toward current movement input. If no input, dash forward relative to camera.
- Implementation: over 0.15 sec, apply a strong velocity in dash direction, then restore normal movement
- Air dash: allowed (same rules as ground dash)
- Cooldown: 2 sec (use a useRef timer, show cooldown in HUD later)

Do not add visual effects yet.
```

---

## Step 5 — Jump Pad

```
Create JumpPad.jsx.

Visual: flat box [1.5, 0.2, 1.5], bright green emissive material (#00ff88).
Collider: RigidBody type="fixed", CuboidCollider matching size.
Name the rigidBodyObject "jumppad".

On collision with player:
onCollisionEnter={({ other }) => {
  if (other.rigidBodyObject?.name === "player") {
    playerRigidBodyRef.current.applyImpulse({ x: 0, y: 15, z: 0 }, true)
  }
}}

Directional variant: add an optional prop "direction" that applies forward impulse too:
{ x: 0, y: 12, z: -8 } (forward + up)

Add a subtle bounce animation on the pad mesh when triggered (scale Y briefly to 0.7 then back).

Add 3 jump pads to the test scene in different positions to verify it works.
```

---

## Step 6 — Speed Boost Pad

```
Create BoostPad.jsx.

Visual: flat box [2, 0.1, 2], bright blue emissive material (#0088ff).
Add forward-pointing arrow geometry or decal on top.
Name the rigidBodyObject "boostpad".

On collision with player:
- Call activateBoost() from useGameStore
- In Player.jsx: when boostActive is true, multiply movement speed by 1.8
- When boostTimeLeft hits 0, return to normal speed

FOV effect (in PlayerCamera.jsx):
- When boost activates, tween FOV from 85 to 95 over 0.2 sec
- When boost ends, tween FOV back to 85 over 0.3 sec
- Use a useRef to track current FOV and lerp it in useFrame

Add 2 boost pads to the test scene.
```

---

## Step 7 — Checkpoints

```
Create Checkpoint.jsx.

Visual: A torus (ring) standing vertically, diameter ~2 units.
- Inactive: white/grey emissive glow
- Active: green emissive glow (#44ff88)
- Add slow rotation animation (Y axis, 0.5 rad/sec)

On player collision:
- Call setCheckpoint(position) from useGameStore with the checkpoint's world position
- Change the ring colour to green (use local state)
- Play a chime sound (we will add audio in Phase 4 — leave a TODO comment here)
- Each checkpoint can only activate once per run

Update the death/respawn logic in Player.jsx:
- When player falls below Y = -10, teleport to checkpointPos from the store instead of [0,3,0]

Add 2 checkpoints to the test scene.
```

---

## Mechanic Sandbox Layout

Add this temporary test layout to Scene.jsx to verify all mechanics:

```
Test layout (all platforms static, just for mechanic testing):

Ground:               pos [0, 0, 0],    size [20, 0.5, 20]
Wall run wall 1:      pos [10, 3, 0],   size [0.5, 6, 8]   (right side)
Wall run wall 2:      pos [-10, 3, 0],  size [0.5, 6, 8]   (left side)
Elevated platform:    pos [0, 5, -8],   size [4, 0.5, 4]
Slide tunnel roof:    pos [5, 1.8, 8],  size [6, 0.5, 4]   (must slide under)
JumpPad:              pos [0, 0.2, -4]
BoostPad:             pos [-5, 0.2, 0]
Checkpoint:           pos [0, 0.5, -8]
```

This is temporary scaffolding. You will delete it when you build the real levels in Phase 3.

---

## Phase 2 Complete Checklist

| Test | Pass? |
|---|---|
| Sprinting into a wall while airborne starts wall run | |
| Wall run reduces falling speed | |
| Pressing Space during wall run performs wall jump | |
| C while sprinting triggers slide, player visibly lowers | |
| Slide-jumping works (Space during slide) | |
| E dashes in movement direction | |
| Air dash works | |
| Dash has a 2 sec cooldown (test by spamming E) | |
| Jump pad launches player high | |
| Boost pad increases speed noticeably + FOV widens | |
| Boost expires after 2 sec | |
| Running through checkpoint saves respawn position | |
| Falling now respawns at checkpoint, not origin | |
| Zustand store values update correctly (check React DevTools) | |

---

## Common Bugs at This Stage

**Wall run triggers on the ground**  
→ Add a `!isGrounded` check before wall run activation.

**Slide doesn't lower the player visually**  
→ The collider shrinks but the mesh doesn't. Scale the mesh Y to 0.5 during slide and restore after.

**Dash overshoots and flies off the map**  
→ Cap the dash velocity. After 0.15 sec, clamp speed back to sprint speed.

**Boost pad keeps re-triggering every frame**  
→ Add a `hasTriggered` ref to BoostPad — only fire once per player contact, reset on exit.

```
The boost pad keeps calling activateBoost() multiple times in one collision. 
Add a boolean ref "hasTriggered" that prevents re-firing until onCollisionExit resets it.
```

**Jump pad doesn't respond**  
→ Make sure the player RigidBody has a name prop set to "player". Rapier collision name checks are case-sensitive.

---

*Phase 2 of 4 — VEGA Parkour*
