# Phase 4 — Final Polish, Juice & Deploy
**Time budget:** 3:15 → 4:00 (last 45 minutes)  
**Goal:** Ship a game that looks and feels finished. Full cyberpunk UI, juice effects, deployed to Vercel.  
**Rule:** Do juice in order — highest ROI first. Stop adding features at 3:45. The last 15 minutes are for deploy only.

---

## Design System — Cyberpunk Theme

Brief your AI pilot with this entire block before building any UI component.

```
We are using a cyberpunk aesthetic for all UI. Apply this design system to every screen.

COLOR TOKENS:
  --cyber-bg:        #05050f   (near-black, deep navy)
  --cyber-surface:   #0d0d1f   (card/panel background)
  --cyber-border:    #1a1a3a   (subtle panel borders)
  --cyber-cyan:      #00fff0   (primary neon — titles, active states, glows)
  --cyber-magenta:   #ff00aa   (secondary neon — danger, death, alerts)
  --cyber-yellow:    #f0ff00   (gold medal, score highlights)
  --cyber-green:     #00ff88   (checkpoints, success, level complete)
  --cyber-muted:     #4a4a7a   (locked states, placeholder text)
  --cyber-text:      #c8d0e8   (body text)

TYPOGRAPHY:
  Headings:  "Press Start 2P" (Google Fonts) — pixel/retro feel
  Body/UI:   "Share Tech Mono" (Google Fonts) — clean mono, readable
  Add both to index.html:
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap" rel="stylesheet">

BORDERS & CORNERS:
  All panels use clip-path for angled corners (cyberpunk "cut corner" style):
  clip-path: polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)
  Border: 1px solid var(--cyber-cyan)
  Box-shadow: 0 0 12px rgba(0,255,240,0.25)

GLITCH EFFECT (titles only):
  @keyframes glitch {
    0%, 90%, 100% { clip-path: none; transform: none; }
    92% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translate(-3px, 0); }
    94% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translate(3px, 0); }
    96% { clip-path: none; transform: translate(-1px, 0); }
  }
  .glitch-title { animation: glitch 4s infinite; }

SCANLINES (all full-screen panels):
  .scanlines::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      transparent, transparent 2px,
      rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

BUTTONS:
  Default:  transparent bg, 1px solid --cyber-cyan border, --cyber-cyan color
            font: Share Tech Mono, letter-spacing 0.12em, uppercase
            hover: bg rgba(0,255,240,0.08), box-shadow 0 0 18px rgba(0,255,240,0.45)
  Danger:   same but magenta
  Success:  same but green
  Disabled: muted border/color, cursor: not-allowed, no hover

NEON GLOW on text:
  text-shadow: 0 0 8px currentColor, 0 0 20px currentColor
```

---

## What "Done" Looks Like

- [ ] Global cyberpunk tokens + fonts wired in index.html / index.css
- [ ] Main menu — cyberpunk, level cards, lock state, best times, controls hint
- [ ] Death screen — magenta glitch, retry + level select
- [ ] Level complete — green/cyan, score breakdown, medal pop
- [ ] HUD — timer (red pulse under 20s), score, boost bar, dash cooldown
- [ ] Landing camera shake
- [ ] Speed vignette + chroma shift during boost
- [ ] Jump squash/stretch
- [ ] Checkpoint green burst + chime
- [ ] Laser warning pulse
- [ ] Deployed to Vercel with a live URL

---

## Juice Priority Order

Implement in this exact order. Stop at whatever step you reach by 3:45 and deploy.

| Priority | Item | Time |
|---|---|---|
| 1 | Global tokens + fonts in index.html/css | 3 min |
| 2 | Main menu — cyberpunk redesign | 8 min |
| 3 | Death screen — cyberpunk redesign | 5 min |
| 4 | Level complete — cyberpunk redesign | 8 min |
| 5 | HUD — cyberpunk redesign | 6 min |
| 6 | Landing camera shake | 4 min |
| 7 | Speed vignette + chroma shift | 5 min |
| 8 | Jump squash/stretch | 4 min |
| 9 | Checkpoint visual polish | 3 min |
| 10 | Laser warning pulse | 3 min |
| **STOP** | **→ Deploy at 3:45** | — |

---

## Step 1 — Global Setup

```
In index.html <head>:
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap" rel="stylesheet">

In index.css — replace everything with:

:root {
  --cyber-bg:       #05050f;
  --cyber-surface:  #0d0d1f;
  --cyber-border:   #1a1a3a;
  --cyber-cyan:     #00fff0;
  --cyber-magenta:  #ff00aa;
  --cyber-yellow:   #f0ff00;
  --cyber-green:    #00ff88;
  --cyber-muted:    #4a4a7a;
  --cyber-text:     #c8d0e8;
}

body {
  background: var(--cyber-bg);
  font-family: 'Share Tech Mono', monospace;
  color: var(--cyber-text);
  margin: 0;
  overflow: hidden;
}

.cyber-panel {
  clip-path: polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px);
  background: var(--cyber-surface);
  border: 1px solid var(--cyber-cyan);
  box-shadow: 0 0 12px rgba(0,255,240,0.2), inset 0 0 24px rgba(0,255,240,0.04);
  position: relative;
}

.scanlines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    transparent, transparent 2px,
    rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
  );
  pointer-events: none;
  z-index: 1;
}

@keyframes glitch {
  0%, 90%, 100% { clip-path: none; transform: none; }
  92% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translate(-3px, 0); }
  94% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translate(3px, 0); }
  96% { clip-path: none; transform: translate(-1px, 0); }
}

.glitch-title {
  animation: glitch 4s infinite;
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px var(--cyber-cyan), 0 0 24px var(--cyber-cyan);
  font-family: 'Press Start 2P', monospace;
}

.cyber-btn {
  background: transparent;
  border: 1px solid var(--cyber-cyan);
  color: var(--cyber-cyan);
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 10px 24px;
  cursor: pointer;
  transition: all 0.15s ease;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
}
.cyber-btn:hover {
  background: rgba(0,255,240,0.08);
  box-shadow: 0 0 18px rgba(0,255,240,0.45);
}
.cyber-btn.danger { border-color: var(--cyber-magenta); color: var(--cyber-magenta); }
.cyber-btn.danger:hover { background: rgba(255,0,170,0.08); box-shadow: 0 0 18px rgba(255,0,170,0.45); }
.cyber-btn.success { border-color: var(--cyber-green); color: var(--cyber-green); }
.cyber-btn.success:hover { background: rgba(0,255,136,0.08); box-shadow: 0 0 18px rgba(0,255,136,0.45); }
.cyber-btn:disabled { border-color: var(--cyber-muted); color: var(--cyber-muted); cursor: not-allowed; box-shadow: none; }
```

---

## Step 2 — Main Menu (Cyberpunk Redesign)

Replace the Phase 3 placeholder with this full version.

```
Update src/ui/MainMenu.jsx with the cyberpunk design.

Full layout:

┌─────────────────────────────────────────────┐  ← scanlines overlay
│                                              │
│         V E G A  P A R K O U R              │  ← Press Start 2P, cyan, glitch-title class
│         ─────────────────────               │  ← 1px cyan line
│           CHOOSE YOUR RUN                   │  ← Share Tech Mono, muted, 12px
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  LVL 01  │  │  LVL 02  │  │  LVL 03  │  │  ← cyber-panel cards
│  │  EASY    │  │  MEDIUM  │  │  HARD    │  │
│  │          │  │  🔒      │  │  🔒      │  │  ← locked = padlock + muted
│  │  1:24 🥇 │  │          │  │          │  │  ← best time + medal if beaten
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│            [ START LEVEL 1 ]                │  ← cyber-btn success, active level only
│                                              │
│  WASD MOVE · SPACE JUMP · SHIFT SPRINT · C SLIDE · E DASH  │  ← tiny hint row
└─────────────────────────────────────────────┘

Animated background (subtle — low opacity):
  A CSS grid of dots using radial-gradient on a background-size tile:
  background: radial-gradient(circle, rgba(0,255,240,0.07) 1px, transparent 1px);
  background-size: 28px 28px;
  Animate background-position slowly: @keyframes gridDrift { to { background-position: 28px 28px; } }
  animation: gridDrift 6s linear infinite;

Level cards:
  - Unlocked: cyber-panel class, cyan border, hover scale 1.02 transform
  - Locked: same panel but border --cyber-muted, color --cyber-muted, cursor not-allowed
  - Click sets selectedLevel local state (default 0)
  - Best time display: Share Tech Mono 11px, --cyber-yellow
  - Medal emoji next to best time if applicable

START button:
  - Shows "START LEVEL [selectedLevel + 1]"
  - Only active for unlocked levels

Hint row:
  - Bottom of screen, Share Tech Mono 10px, --cyber-muted
  - Single horizontal line, centered
```

---

## Step 3 — Death Screen (Cyberpunk Redesign)

Replace the Phase 3 placeholder with this full version.

```
Update src/ui/DeathScreen.jsx with the cyberpunk design.

Layout:

┌─────────────────────────────────────────────┐  ← scanlines, rgba(5,5,15,0.88) bg
│                                              │
│           S Y S T E M                       │
│           F A I L U R E                     │  ← Press Start 2P, magenta, glitch anim
│                                              │
│     LEVEL 01     ☠ DEATHS: 3               │  ← Share Tech Mono, muted
│                                              │
│              [ RETRY ]                       │  ← cyber-btn danger (magenta)
│                                              │
│    ─────── SELECT LEVEL ───────             │  ← Share Tech Mono 10px, muted
│                                              │
│   [ LVL 01 ]   [ LVL 02 ]   [ LVL 03 ]    │  ← small cyber-btn, disabled if locked
│                                              │
│                [ MENU ]                      │  ← small, muted style
└─────────────────────────────────────────────┘

Entry animation:
@keyframes deathEntry {
  0%   { transform: translate(6px, 0) skewX(8deg); opacity: 0; }
  30%  { transform: translate(-4px, 0) skewX(-4deg); opacity: 0.8; }
  60%  { transform: translate(2px, 0); opacity: 1; }
  100% { transform: none; opacity: 1; }
}
Apply to the "SYSTEM FAILURE" heading — animation: deathEntry 0.4s ease both;

Overlay fade-in: opacity 0 → 1 over 0.2 sec on mount.

Data to show:
- currentLevel + 1 (from store)
- deathCount (from store)

Button actions:
- RETRY      → startLevel(currentLevel)
- LVL 01/02/03 → startLevel(n), disabled if not in unlockedLevels
- MENU        → goToMenu()
```

---

## Step 4 — Level Complete Screen (Cyberpunk Redesign)

Replace the Phase 3 placeholder with this full version.

```
Update src/ui/LevelComplete.jsx with the cyberpunk design.

STANDARD COMPLETE LAYOUT:

┌─────────────────────────────────────────────┐  ← scanlines, dark bg
│                                              │
│         LEVEL 01 COMPLETE                   │  ← Press Start 2P, cyan, glitch-title
│                                              │
│    🥇  GOLD                                 │  ← medal, large, medalPop animation
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │  TIME REMAINING   1:24   × 10 = 840  │  │  ← Share Tech Mono
│   │  ORBS COLLECTED     4    × 10 =  40  │  │
│   │  ────────────────────────────────    │  │
│   │  TOTAL SCORE               880       │  │  ← --cyber-yellow, neon glow, counts up
│   └──────────────────────────────────────┘  │  ← cyber-panel class
│                                              │
│    [ NEXT LEVEL ]          [ RETRY ]        │  ← success btn / default btn
│                                              │
│    ─────── SELECT LEVEL ───────            │
│   [ LVL 01 ]  [ LVL 02 ]  [ LVL 03 ]     │
│               [ MENU ]                      │
└─────────────────────────────────────────────┘

YOU WIN (Level 3 complete):
  - Replace heading with "RUN COMPLETE" in --cyber-yellow
  - Add line: "YOU ARE IN THE 20%" in 10px muted text
  - No NEXT LEVEL button

Medal pop animation:
@keyframes medalPop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  70%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
animation: medalPop 0.5s ease 0.3s both;

Medal logic:
  timeRemaining >= targetTimes.gold   → 🥇 --cyber-yellow glow
  timeRemaining >= targetTimes.silver → 🥈 silver (#b0b8c8)
  timeRemaining >= targetTimes.bronze → 🥉 bronze (#cd7f32)
  else                                → no medal, no glow

Score count-up animation:
  useEffect on mount → setInterval incrementing displayScore by ~total/40 every 20ms
  until displayScore >= totalScore

Score calc:
  timeScore  = Math.floor(timeRemaining) * 10
  orbScore   = orbsCollected * 10
  totalScore = timeScore + orbScore

Button actions:
  NEXT LEVEL  → startLevel(currentLevel + 1)  (hidden/disabled if currentLevel === 2)
  RETRY       → startLevel(currentLevel)
  LVL 01/02/03 → startLevel(n), disabled if locked
  MENU         → goToMenu()
```

---

## Step 5 — HUD (Cyberpunk Redesign)

Replace the Phase 3 placeholder with this full version.

```
Update src/ui/HUD.jsx — absolute overlay, z-index above canvas, only visible during "playing".

LAYOUT (4 corners + centre top):

  TOP LEFT         TOP CENTRE           TOP RIGHT
  LEVEL 01/03     [  01:45  ]          ◈ 240 PTS
                   (Press Start 2P)     +10 ↑ pop

  BOTTOM LEFT                           BOTTOM RIGHT
  BOOST ████░░░░                        DASH ●○

TIMER (top centre):
  - Press Start 2P 20px, --cyber-cyan normally
  - Format: MM:SS
  - Wrap in a small cyber-panel pill (dark bg, cyan border)
  - Under 20 sec:
    @keyframes timerPulse {
      0%, 100% { transform: scale(1); text-shadow: 0 0 8px var(--cyber-magenta); }
      50%      { transform: scale(1.08); text-shadow: 0 0 22px var(--cyber-magenta); }
    }
    color: var(--cyber-magenta); animation: timerPulse 0.5s ease infinite;

SCORE (top right):
  - Share Tech Mono 14px, --cyber-yellow
  - ◈ (U+25C8) prefix
  - +10 pop on orb collect: spawn a "+10" div, float up 30px + fade out over 0.6 sec
  - Use an array of active pops in local state, clear after animation

LEVEL INDICATOR (top left):
  - Share Tech Mono 12px, --cyber-muted
  - "LEVEL 01 / 03"

DEATHS (top left, below level — small):
  - ☠ {deathCount}
  - --cyber-magenta if deathCount > 0, else --cyber-muted

BOOST BAR (bottom left, only when boostActive):
  - "BOOST" label 10px cyan above bar
  - Bar: full = 2 sec, depletes left to right
  - Color: --cyber-cyan, bg: --cyber-border
  - Width: 120px, height 4px
  - Fade in on boostActive, fade out after boost ends

DASH COOLDOWN (bottom right):
  - "DASH" label 10px below
  - A small arc/circle (SVG or CSS border-radius trick) that fills over 2 sec
  - --cyber-muted while on cooldown, --cyber-cyan when ready
  - Expose dashReady and dashCooldownPct from store or pass as props from Player.jsx
```

---

## Step 6 — Landing Camera Shake

```
Add to PlayerCamera.jsx.

On airborne → grounded transition:
  const landingVelocityY = Math.abs(rigidBodyRef.current.linvel().y);
  shakeIntensity.current = Math.min(landingVelocityY * 0.02, 0.08);

In useFrame:
  if (shakeIntensity.current > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shakeIntensity.current;
    camera.position.y += (Math.random() - 0.5) * shakeIntensity.current;
    shakeIntensity.current *= 0.82;
  } else {
    shakeIntensity.current = 0;
  }

Also on boost pad activation: shakeIntensity.current = 0.04 with decay 0.88.
```

---

## Step 7 — Speed Vignette + Chroma Shift

```
Add to HUD.jsx as two extra full-screen divs (pointer-events: none).

SPEED VIGNETTE:
.speed-vignette {
  position: fixed; inset: 0; pointer-events: none;
  transition: opacity 0.2s ease;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    rgba(0, 255, 240, 0.06) 70%,
    rgba(0, 255, 240, 0.18) 100%
  );
}
Opacity: 0 at walk, 0.5 at sprint, 1.0 during boost.
Read playerSpeed from Zustand store (set by Player.jsx each frame).

CHROMATIC ABERRATION (boost only):
.chroma-shift {
  position: fixed; inset: 0; pointer-events: none;
  opacity: 0; transition: opacity 0.15s;
  mix-blend-mode: screen;
  background: linear-gradient(90deg,
    rgba(255,0,170,0.04) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0,255,240,0.04) 100%
  );
}
opacity: 1 when boostActive, 0 otherwise.
```

---

## Step 8 — Jump Squash/Stretch

```
Add to Player.jsx.

Use a separate meshRef for the visual capsule (not the physics body).
const meshRef = useRef();
const targetScale = useRef([1, 1, 1]);

On jump start (leaving ground):
  targetScale.current = [0.82, 1.28, 0.82];
  setTimeout(() => { targetScale.current = [1, 1, 1]; }, 120);

On landing:
  targetScale.current = [1.28, 0.72, 1.28];
  setTimeout(() => { targetScale.current = [1, 1, 1]; }, 80);

In useFrame:
  if (meshRef.current) {
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale.current[0], 0.22);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale.current[1], 0.22);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale.current[2], 0.22);
  }
```

---

## Step 9 — Checkpoint Visual Polish

```
Update Checkpoint.jsx.

Inactive: torus, white emissive (#ffffff), emissiveIntensity: 0.15, slow Y rotation 0.4 rad/s.

On activation (once per run):
1. Tween emissive color to --cyber-green (#00ff88) over 0.3 sec
   emissiveIntensity → 1.2
2. Add pulsing outer ring (larger torus, scale 1→1.5, opacity 1→0, repeat every 1.5 sec)
3. Particle burst: 10 small Box meshes at checkpoint position,
   random outward positions over 0.4 sec, opacity fades to 0, then unmount

Audio chime (Web Audio API):
const playChime = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(); osc.stop(ctx.currentTime + 0.5);
};
```

---

## Step 10 — Laser Warning Pulse

```
Update Laser.jsx.

DORMANT:   emissiveIntensity = 0.08, color #ff2200
WARNING:   emissiveIntensity = 0.2 + Math.abs(Math.sin(clock.elapsedTime * 18)) * 1.3
           color oscillates #ff2200 ↔ #ff8800
ACTIVE:    emissiveIntensity = 2.4, color #ff2200
           Add outer glow: slightly wider transparent cylinder with red emissive at 0.3 intensity
           Add thin disc at each end of laser cylinder, radius slightly wider, emissiveIntensity 1.0

In useFrame set material emissiveIntensity based on current state.
```

---

## STOP — Deploy at 3:45

> Do not add anything new after 3:45. A live URL beats a perfect game running only on your laptop.

### Deploy Steps

**1. Build check**
```bash
npm run build
```
If it fails, paste the error to your AI pilot:
```
npm run build throws: [paste error]
Most likely cause: import path case mismatch — macOS ignores case, Vercel Linux does not.
Check all import statements match exact filename casing on disk.
```

**2. Commit and push**
```
GitHub Desktop → "VEGA Parkour — final" → Commit to main → Push origin
```

**3. Deploy on Vercel**
- vercel.com/dashboard → Add New → Project → Import repo
- Framework: Vite (auto-detected)
- Build: `npm run build` · Output: `dist`
- Deploy → ~60 sec → copy URL

**4. Smoke test**
- Open the URL on your phone
- Does the cyberpunk main menu load?
- Can you start Level 1?
- If it loads at all — you shipped. Submit the URL.

---

## Final Checklist

| Item | Done? |
|---|---|
| Global CSS tokens + fonts in index.html/css | |
| Main menu — cyberpunk, level cards, lock state, best times | |
| Death screen — magenta glitch entry, retry + level select + menu | |
| Level complete — medal pop, score count-up, next/retry/menu | |
| HUD — timer (red pulse under 20s), score +10 pop, boost bar, dash | |
| Landing camera shake | |
| Speed vignette + chroma shift on boost | |
| Jump squash/stretch visible | |
| Checkpoint ring turns green + particle burst + chime | |
| Laser pulses magenta before activating | |
| `npm run build` passes with no errors | |
| Deployed to Vercel | |
| Live URL: main menu loads, Level 1 is playable | |

---

## Emergency Cuts (if behind at 3:45)

Drop these without hesitation. They do not affect playability.

| Feature | Safe to cut? |
|---|---|
| Animated grid background on menu | ✅ Static dark bg works fine |
| Chromatic aberration shift | ✅ Keep the vignette, drop the chroma |
| Score counter animation | ✅ Show the final number immediately |
| Laser end-cap discs | ✅ Base laser glow is enough |
| Checkpoint particle burst | ✅ Just the colour change is fine |
| Death screen glitch entry animation | ✅ Plain fade-in is okay |
| Checkpoint audio chime | ✅ Silent checkpoint still works |

**Never cut:**
- Main menu with level select + lock state
- Death screen with RETRY and MENU buttons
- Timer display
- End portal triggering level complete
- Deploy

---

## Post-Jam Extensions

- Ghost replay (record position frames — store in Neon Postgres)
- Leaderboard via Neon + Better Auth
- Mobile touch controls overlay
- Level editor: JSON config → shareable URL
- Multiplayer race mode via WebSocket

---

*Phase 4 of 4 — VEGA Parkour — ship it.*
