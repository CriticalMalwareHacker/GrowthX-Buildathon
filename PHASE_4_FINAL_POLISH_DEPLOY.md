# Phase 4 — Final Polish, Juice & Deploy
**Time budget:** 3:15 → 4:00 (last 45 minutes)  
**Goal:** Ship a game that looks and feels finished. Add juice, build the UI, deploy to Vercel.  
**Rule:** Do juice in order — highest ROI first. Stop adding features at 3:45. The last 15 minutes are for deploy only.

---

## What "Done" Looks Like

- [ ] Death screen with instant retry button
- [ ] Level complete screen with score, medal, and next level button
- [ ] Timer and score visible on HUD during play
- [ ] Landing camera shake
- [ ] Speed lines during sprint/boost
- [ ] Jump squash/stretch on player mesh
- [ ] Checkpoint chime + green ring on activation
- [ ] Laser warning pulse
- [ ] Game deployed to Vercel with a live URL

---

## Juice Priority Order

Implement in this exact order. If time runs short, stop at whatever step you're on and go deploy.

| Priority | Effect | Time to implement |
|---|---|---|
| 1 | Death screen + retry button | 5 min |
| 2 | Level complete screen + medal | 8 min |
| 3 | HUD (timer + score) | 5 min |
| 4 | Landing camera shake | 5 min |
| 5 | Speed lines | 8 min |
| 6 | Jump squash/stretch | 5 min |
| 7 | Checkpoint visual polish | 4 min |
| 8 | Laser warning pulse | 4 min |
| 9 | Boost FOV ease | 3 min |
| 10 | Dash afterimage | 5 min |
| **STOP** | **→ Deploy at 3:45** | — |

---

## Step 1 — Death Screen

```
Create src/ui/DeathScreen.jsx.

Show this overlay when gameStatus === "dead" in the Zustand store.

Design:
- Full screen dark overlay (rgba black, 0.75 opacity)
- Large text: "YOU DIED"
- Smaller text: "Level [N]"
- A single "RETRY" button — large, easy to click, centred on screen

On RETRY click:
- Call startLevel(currentLevel) from useGameStore
- This resets the timer, score, and checkpoint to level defaults

The overlay must appear in under 0.5 sec of the death event.
Use a CSS fade-in animation (opacity 0 → 1 over 0.3 sec).

Mount this as an HTML overlay on top of the Canvas in App.jsx using absolute positioning.
```

---

## Step 2 — Level Complete Screen

```
Create src/ui/LevelComplete.jsx.

Show this overlay when gameStatus === "levelComplete".

Design:
- Full screen overlay
- Large text: "LEVEL COMPLETE"
- Score breakdown:
    Time Remaining: [X] sec  × 10 = [X] pts
    Orbs Collected: [X]      × 10 = [X] pts
    ─────────────────────────────────────────
    Total Score: [X]
- Medal display:
    Gold trophy if time <= targetTimes.gold
    Silver trophy if time <= targetTimes.silver
    Bronze trophy if time <= targetTimes.bronze
    Show medal with a simple CSS animated bounce on appear
- Two buttons:
    "NEXT LEVEL" (disabled and greyed out if on Level 3)
    "RETRY" (to beat your time)
- "YOU WIN" text replaces "LEVEL COMPLETE" when Level 3 is beaten

Pull score and timeRemaining from the Zustand store.
Pull targetTimes from the current level config object.
```

---

## Step 3 — HUD

```
Create src/ui/HUD.jsx. Mount it as an HTML overlay in App.jsx.

Elements:
1. Timer (top centre)
   - Large monospace font
   - Format: MM:SS (e.g. "2:45")
   - Turns red and pulses when timeRemaining < 20 sec
   - Use CSS animation: color: red, scale pulse 1.0→1.1 over 0.5 sec repeat

2. Score (top right)
   - Current score number
   - Brief +10 pop-up animation when an orb is collected (float up and fade out)

3. Level indicator (top left)
   - "LEVEL 1 / 3" etc.

4. Boost indicator (bottom centre, only when boost is active)
   - A horizontal bar that depletes over the 2 sec boost duration
   - Blue colour matching the boost pad

5. Dash cooldown (bottom right, small)
   - A small circle that fills up over 2 sec after a dash
   - Grey when on cooldown, white when ready

Keep all styling minimal — dark background pill containers, white text, no clutter.
Use the font "Press Start 2P" from Google Fonts for the timer and score for arcade feel.
Add this to index.html: <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

---

## Step 4 — Landing Camera Shake

```
Add camera shake to PlayerCamera.jsx.

Trigger: player becomes grounded after being airborne (detect the transition).
The harder the landing (higher fall velocity Y), the stronger the shake.

Implementation:
- When landing is detected, set shakeIntensity = clamp(abs(landingVelocityY) * 0.02, 0.02, 0.08)
- In useFrame, if shakeIntensity > 0:
    camera.position.x += (Math.random() - 0.5) * shakeIntensity
    camera.position.y += (Math.random() - 0.5) * shakeIntensity
    shakeIntensity *= 0.85  (decay per frame)
    if shakeIntensity < 0.001: shakeIntensity = 0

Also add shake on boost pad activation (intensity 0.04, shorter decay).
```

---

## Step 5 — Speed Lines

```
Add speed lines as a particle effect in PlayerCamera.jsx or a separate SpeedLines.jsx.

Trigger: show when player speed > 10 units/sec (sprinting or boosted).
Intensity scales with speed — stronger during boost.

Implementation using R3F Points or simple line geometry:
- 30 thin line segments radiating outward from the camera centre
- Each line starts at a random position on a small circle around the forward axis
- Lines stream toward the camera (Z+ in camera space)
- Opacity: 0 at low speed, lerp to 0.6 at max speed
- Length: scales with speed

Simplest approach — use a sprite-based solution:
- Create a <Points> cloud of ~40 points in front of the camera
- Move them toward camera each frame, reset when they pass the camera
- Fade in/out based on current speed

If this is taking too long: skip the geometry approach and use a CSS vignette 
that intensifies at high speed (much simpler):
- A div with radial-gradient from transparent centre to rgba(255,255,255,0.15) edge
- CSS transition opacity 0.2s
- Set opacity 0 at walk speed, 0.4 at sprint, 0.7 during boost
```

---

## Step 6 — Jump Squash/Stretch

```
Add squash and stretch to the player mesh in Player.jsx.

Track the player's vertical velocity and grounded state.

On jump (leaving ground):
- Tween mesh scale from [1, 1, 1] to [0.85, 1.3, 0.85] over 0.1 sec (stretch upward)
- Then lerp back to [1, 1, 1] over 0.3 sec

On landing (hitting ground):
- Tween mesh scale to [1.3, 0.7, 1.3] over 0.05 sec (squash on impact)
- Then spring back to [1, 1, 1] over 0.2 sec

Implementation:
- Use a meshRef (separate from rigidBodyRef)
- In useFrame, lerp the mesh scale each frame toward target scale
- Store targetScale in a useRef

Keep subtle — scale should be noticeable but not cartoonish.
```

---

## Step 7 — Checkpoint Visual Polish

```
Update Checkpoint.jsx visual and feedback.

When player activates a checkpoint:
1. Ring colour transitions from white/grey to green (#44ff88) over 0.3 sec
2. Particle burst: 12 small spheres burst outward from the ring position, 
   fade out over 0.5 sec, then despawn
   Use a simple loop with setTimeout or a useEffect to spawn then remove them
3. (If time allows) Play a chime sound:
   Use the Web Audio API oscillator — no audio file needed:

   const ctx = new AudioContext();
   const osc = ctx.createOscillator();
   const gain = ctx.createGain();
   osc.connect(gain); gain.connect(ctx.destination);
   osc.frequency.value = 880;
   gain.gain.setValueAtTime(0.3, ctx.currentTime);
   gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
   osc.start(); osc.stop(ctx.currentTime + 0.4);
```

---

## Step 8 — Laser Warning Pulse

```
Update Laser.jsx visual behaviour.

During warningTime (0.4 sec before activating):
- Oscillate the material emissiveIntensity between 0.2 and 1.5 in a sine wave
- Use useFrame: emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 20) * 0.65

When active:
- emissiveIntensity = 2.0 (full brightness, constant)

When dormant:
- emissiveIntensity = 0.1 (barely glowing, signals it exists but is safe)

Add a thin "danger ring" disc mesh at each end of the laser cylinder that only shows during active state.
```

---

## Step 9 — Boost FOV Ease

```
This should already be partially implemented from Phase 2.
Verify it feels good and tune if needed.

Target behaviour:
- Boost activates → FOV eases from 85 to 95 over 0.2 sec
- Boost expires → FOV eases from 95 back to 85 over 0.4 sec
- Sprinting (not boosted) → FOV eases to 90 over 0.3 sec
- Walking → FOV returns to 85 over 0.3 sec

In PlayerCamera.jsx useFrame:
  const targetFOV = boostActive ? 95 : isSprinting ? 90 : 85;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.08);
  camera.updateProjectionMatrix();
```

---

## Step 10 — Main Menu (if time allows)

```
Create src/ui/MainMenu.jsx.

Simple level select screen shown when gameStatus === "menu".

Design:
- Game title: "VEGA PARKOUR" in Press Start 2P font
- Three level buttons in a row:
    LEVEL 1 — always unlocked
    LEVEL 2 — locked until Level 1 beaten (show a padlock icon)
    LEVEL 3 — locked until Level 2 beaten
- Each unlocked level shows your best time and medal beneath the button
- Click → calls startLevel(index)

For locked levels: button is greyed out, cursor: not-allowed, clicking does nothing.
Store best times in Zustand: bestTimes: [null, null, null]
Update on levelComplete: if current time < bestTimes[currentLevel], update it.
```

---

## STOP — Deploy at 3:45

> Do not add anything new after 3:45. The last 15 minutes are for deploying. A game on a live URL is infinitely more impressive than a perfect game that only runs on your laptop.

### Deploy Checklist

**1. Commit your code**
```
In GitHub Desktop:
- Check all changed files are listed
- Write a commit message: "VEGA Parkour — final submission"
- Click "Commit to main"
- Click "Push origin"
```

**2. Check for build errors first**
```
npm run build
```
If it fails, paste the error into your AI pilot:
```
Running npm run build throws this error: [paste error]
Fix it. The most likely cause is a case-sensitivity issue in an import path 
(works on Mac, breaks on Linux/Vercel). Check all import statements.
```

**3. Deploy on Vercel**
- Go to vercel.com/dashboard
- Click "Add New → Project"
- Find your GitHub repo → click "Import"
- Framework: Vite (Vercel auto-detects this)
- Build command: `npm run build`
- Output directory: `dist`
- Click "Deploy"
- Wait ~60 seconds

**4. Test the live URL**
- Open the Vercel URL on your phone
- Try to play Level 1 on mobile
- If it crashes: note it but don't fix it — submit the URL anyway

**5. Share the URL**
```
my-parkour-game.vercel.app
```
This is your submission. This is the win condition.

---

## Final Phase 4 Checklist

| Item | Done? |
|---|---|
| Death screen appears instantly on death | |
| Retry button resets level correctly | |
| Level complete screen shows correct score and medal | |
| HUD shows timer (turns red under 20 sec) | |
| HUD shows score | |
| Landing shake feels good (not too strong) | |
| Speed lines appear at sprint/boost speed | |
| Jump has visible squash/stretch | |
| Checkpoint ring turns green on activation | |
| Laser pulses before activating | |
| `npm run build` passes with no errors | |
| Deployed to Vercel | |
| Live URL opens and Level 1 is playable | |

---

## Emergency Cuts (if behind schedule)

If any of these are not done by 3:45, cut them. They are not worth missing the deploy window.

| Feature | Cut if needed? |
|---|---|
| Main menu / level select | ✅ Cut — just auto-start Level 1 |
| Dash afterimage | ✅ Cut |
| Speed line geometry | ✅ Cut — use the CSS vignette instead |
| Mobile touch controls | ✅ Cut |
| Audio (all of it) | ✅ Cut — silent game still ships |
| Fake tiles visual polish | ✅ Cut — slight opacity difference is enough |
| Wall run camera tilt | ✅ Cut |

**Never cut:**
- Death screen + retry button
- Timer
- End portal working
- Deploy

---

## Post-Jam (bonus, if you want to keep building)

- Ghost replay system for time trials
- Mobile touch control overlay
- Leaderboard (Neon Postgres — you already know this stack from Nexus/Dosmos)
- Level 4 — player-designed via a JSON config editor
- Multiplayer race mode (WebSocket)

---

*Phase 4 of 4 — VEGA Parkour — ship it.*
