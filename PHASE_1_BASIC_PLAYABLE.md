# Phase 1 — Basic Playable
**Time budget:** 0:00 → 1:00 (first hour)  
**Goal:** A player that moves, jumps, and lands on platforms. Nothing else.  
**Rule:** No assets. No UI. No obstacles. Just a capsule on boxes.

---

## What "Done" Looks Like

- [ ] Player spawns on a flat platform
- [ ] WASD moves the player
- [ ] Shift sprints
- [ ] Space jumps (with double jump)
- [ ] Player lands on platforms without jitter or falling through
- [ ] Falling off the platform doesn't crash the game
- [ ] Camera follows the player from behind

---

## Step 1 — Brief Your AI Pilot

Paste this as your **very first message**. Do this before anything else.

```
Read AI_CONTEXT.md and App.jsx. Understand the full VEGA stack before we write any code.

We are building a 3D third-person parkour game. Give me a 5-line summary of what's already wired up in the starter.
```

Wait for the summary. Then send:

```
Good. Now read AI_CONTEXT.md again and focus on the Rapier physics rules.

Key constraint: ALL player movement must use Rapier's setLinvel() or applyImpulse(). 
Never use React state to set position — it causes jitter.

We will now build the game step by step. Do not add anything I don't ask for.
```

---

## Step 2 — Scene Setup

```
Set up Scene.jsx with:
- A Physics world from @react-three/rapier
- Ambient light (intensity 0.6) + directional light (intensity 1.2, position [10, 20, 10])
- A flat static ground plane: RigidBody type="fixed", size [60, 0.5, 60], position [0, -0.25, 0], grey color
- A few raised box platforms so we can test jumping:
    { pos: [8, 1, 0],  size: [4, 0.5, 4] }
    { pos: [14, 2, 0], size: [3, 0.5, 3] }
    { pos: [20, 3, 0], size: [3, 0.5, 3] }
- Fog: <fogExp2 color="#e8e8e8" density={0.02} />

Keep everything as basic box geometry with meshStandardMaterial. No assets.
```

---

## Step 3 — Player Movement

```
Create Player.jsx with a Rapier RigidBody (type="dynamic") and a CapsuleCollider.

Movement specs:
- Walk speed: 6 units/sec
- Sprint speed: 12 units/sec (hold Shift)
- Use setLinvel() every frame for horizontal movement — preserve the Y velocity from physics
- Movement direction should be relative to camera facing, not world axes

Jump specs:
- Jump impulse Y: 8
- Double jump: allowed (track with a jumpCount ref, reset on ground contact)
- Coyote time: 0.15 sec (can jump just after leaving an edge — use a timer ref)
- Jump buffer: 0.1 sec (store jump input early — use a timer ref)
- Detect grounded state via a short downward raycast from the player's feet

Use useRef for rigidBodyRef. Use useFrame for the movement loop.
Use keyboard input from @react-three/drei's useKeyboardControls or direct keydown/keyup listeners.

Do not add wall run, slide, or dash yet.
```

---

## Step 4 — Camera

```
Create PlayerCamera.jsx as a separate component.

Specs:
- Third-person camera that follows the player
- Offset from player: (0, 2.5, 5) in local space
- Use useFrame to lerp camera position toward target each frame (lerp factor 0.1)
- FOV: 85 degrees
- Do NOT use OrbitControls
- Camera should rotate with mouse input (use pointer lock or simple mouse delta tracking)
- Player movement direction should be relative to camera's forward vector
```

---

## Step 5 — Void Death

```
Add a simple death/respawn system:

- If player Y position drops below -10, respawn them at [0, 3, 0]
- No game over screen yet — just teleport back instantly
- Use rigidBodyRef.current.setTranslation({ x: 0, y: 3, z: 0 }) to teleport
- Also reset velocity: rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 })
```

---

## Phase 1 Complete Checklist

Test each of these manually before moving to Phase 2.

| Test | Pass? |
|---|---|
| Player spawns without falling through the floor | |
| WASD moves the player smoothly | |
| Shift makes the player noticeably faster | |
| Space jumps. Can double jump in the air | |
| Can jump just after walking off a platform edge (coyote time) | |
| Camera follows behind the player without snapping | |
| Falling into the void respawns the player instantly | |
| No console errors | |

---

## Common Bugs at This Stage

**Player falls through floor**  
→ The Rapier collider size doesn't match the mesh. Check CapsuleCollider args match the visual size.

**Player jitters while moving**  
→ You (or the AI) used setState on position. Replace with `setLinvel()`.

**Camera clips through walls**  
→ Ignore for now. Fix in Phase 3.

**Jump doesn't feel right**  
→ Tune the impulse Y value (try 6–10). Also check gravity scale on the RigidBody — set it to 2.5 for snappier feel.

```
The jump feels floaty. Increase the gravity scale on the player RigidBody to 2.5 
and increase the jump impulse Y from 8 to 9. Keep coyote time and jump buffer as-is.
```

---

*Phase 1 of 4 — VEGA Parkour*
