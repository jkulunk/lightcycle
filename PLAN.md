# Tron Light Cycle — Game Design & Architecture Plan

## 1. Overview & Core Vision
A 3D web-based **Tron Light Cycle** arena game built with **Three.js** (WebGL) where a human player battles an AI opponent on "The Grid." As cycles move at high speed along orthogonal grid axes, they leave solid glowing **light ribbons (trails)** behind them. Contact with the arena perimeter wall or any light trail results in immediate **derezzing** (explosion).

The game supports **seamless real-time switching** (plus pre-match selection) between three distinct camera perspectives:
1. **Bird's-Eye View (Top-Down Tactical)**
2. **Over-the-Shoulder View (3rd-Person Chase Cam)**
3. **First-Person View (Cockpit / Canopy Cam)**

---

## 2. Recommended Tech Stack
- **Rendering Engine**: **Three.js** (3D geometry, custom neon shaders/bloom post-processing, perspective/orthographic cameras)
- **Post-Processing**: `UnrealBloomPass` (`EffectComposer`) for authentic neon glow on grid lines, light cycles, and light walls
- **Audio**: **Web Audio API** procedural synth (engine hum pitch-shifted by speed/boost, sharp 90° turn chirp, derezz explosion, synthwave background pulse)
- **Bundler / Runtime**: Single-page ES Module setup (Vite or zero-build CDN ES modules for instant browser launch)

---

## 3. Core Gameplay Mechanics

### 3.0 Match Intro Sequence: Baton / Rod Light Cycle Initialization (`IntroSequence.js`)
Before each match begins (or when pressing **LAUNCH**), a cinematic **2.8-second procedural 3D intro animation** plays on the Grid (skippable with `Space`):
1. **Stage 1 — Baton Activation (`0.0s – 0.8s`)**:
   - The Player (Cyan) and CPU (Orange) digitized riders stand facing the center of the Grid holding their cylindrical **Light Cycle Control Rods (Batons)** horizontally at chest height.
   - The rods ignite with a high-energy neon core flash and dual-handed grip separation as the camera orbits low around the rider.
2. **Stage 2 — Forward Leap & Wireframe Extrusion (`0.8s – 1.8s`)**:
   - Both riders sprint two steps and leap forward into a horizontal riding posture while thrusting the glowing baton ahead.
   - Neon laser rings project forward and backward from the baton handles to form the spinning front and rear hubless light wheels, followed by a wireframe-to-solid shader sweep that materializes the chassis and encloses the translucent canopy over the rider's back.
3. **Stage 3 — Wheel Touchdown & Camera Transition (`1.8s – 2.8s`)**:
   - The newly materialized Light Cycles slam onto the Grid floor with a neon shockwave ripple and rising turbine pitch (`3... 2... 1... GO!`), smoothly interpolating the camera into the player's selected view (**Bird's-Eye**, **Over-the-Shoulder**, or **First-Person Cockpit**) as the cycles launch at full speed.

### 3.1 The Grid & Movement
- **Arena Size**: `200 x 200` logical grid units surrounded by glowing perimeter containment walls.
- **Discrete-Aligned Continuous Movement**:
  - Cycles move continuously for smooth 60 FPS rendering in 3D, while turns snap to grid sub-divisions (`1.0` unit) to prevent micro-clipping and keep classic 90-degree geometric trails.
  - **Base Speed**: `40 units/sec`
  - **Boost / Turbo**: Limited energy bar (regenerates slowly or fueled by riding close to enemy walls — *rubber-band / slipstream mechanic*).
- **Light Trails (Jetwalls)**:
  - Each turn drops a vertex anchor `(x, z)` and extrudes a glowing vertical ribbon mesh (`height: 2.5 units`) behind the cycle.
  - Current active segment dynamically scales between the last turn vertex and the cycle's rear wheel.

### 3.2 Control Mapping (View-Aware)
A critical UX detail is that controls must feel natural in the active view:
- **Bird's-Eye View**:
  - Option A (Default): **Absolute / Cardinal** (`W/Up` = North, `S/Down` = South, `A/Left` = West, `D/Right` = East) — prevents accidental self-collision if pressing the current direction.
  - Option B: **Relative** (`A/Left` = 90° counter-clockwise, `D/Right` = 90° clockwise).
- **Over-the-Shoulder & First-Person Views**:
  - **Relative Steering** (`A / Left Arrow` = Turn 90° Left, `D / Right Arrow` = Turn 90° Right, `W / Space` = Boost, `S` = Speed Brake).
- **Camera Toggle**: `C` or `1` / `2` / `3` keys to switch views instantly mid-match.

---

## 4. Camera Perspectives & Visual Behavior

| View Mode | Camera Type | Positioning & Dynamics | Gameplay Feel & HUD Aids |
| :--- | :--- | :--- | :--- |
| **1. Bird's-Eye** | Orthographic (or high-altitude low-FOV Perspective) | `Y = 180`, looking straight down at `(0, 0, 0)`. Slight tilt (`5°`) for 3D wall depth. | Full strategic awareness of territory, Voronoi space, and AI pathing. Classic arcade feel. |
| **2. Over-the-Shoulder** | Perspective (`FOV 65°`) | `8 units` behind, `3.5 units` above player cycle. Spring-damped slerp (`~120ms`) on 90° turns so turns feel snappy without motion sickness. | Cinematic, high-speed chase feel. Shows the cycle model leaning into turns and enemy walls towering ahead. |
| **3. First-Person** | Perspective (`FOV 85°`) | Inside the translucent canopy at `Y = 1.1`, slightly ahead of center. Instant or ultra-fast (`40ms`) yaw snap on turns with subtle cockpit roll (`±8°`). | Intense claustrophobic speed. Requires **HUD Radar Minimap** + **Proximity Threat Chevrons** since peripheral/rear visibility is limited. |

---

## 5. AI Opponent Architecture ("Sark / Clu AI")

The computer opponent operates on a tick-based decision evaluator at every grid intersection:
1. **Immediate Survival (Ray/Grid Lookahead)**:
   - Evaluates forward, left, and right rays (`1` to `N` cells ahead) to eliminate lethal moves.
2. **Flood-Fill / Territory Heuristic (Voronoi Space Estimation)**:
   - When trapped or in close quarters, runs a bounded Breadth-First Search (BFS) from each candidate turn to count reachable open cells, always choosing the move that maximizes surviving space.
3. **Aggressive Cutoff Mode**:
   - When in open space, compares distance to the player's projected trajectory. If the AI is ahead on a parallel vector, it turns across the player's path to box them in.
4. **Difficulty Scaling**:
   - **Novice**: Short lookahead, occasional suboptimal turns, no boost usage.
   - **Grid Warrior (Normal)**: BFS flood-fill + opportunistic cutoffs.
   - **Master Control (Hard)**: Full Voronoi territory maximization + aggressive boost cutoffs.

---

## 6. Project Structure & Implementation Phases

```text
lightcycle/
├── index.html              # Entry point, HUD overlay, view switcher UI
├── style.css               # Neon cyberpunk UI styling, scanlines, radar HUD
├── storyboard.svg          # Visual 6-panel storyboard illustration
├── storyboard.html         # Interactive storyboard & concept preview
└── src/
    ├── main.js             # Game loop, state machine (Menu, RodIntro, Countdown, Playing, Derezz)
    ├── scene/
    │   ├── GridArena.js    # Glowing floor grid, perimeter walls, starfield/cyber-skybox
    │   ├── IntroSequence.js# Cinematic Baton/Rod activation & wireframe cycle materialization
    │   ├── LightCycle.js   # 3D cycle mesh (wheels, canopy, neon trim) & trail renderer
    │   └── Particles.js    # Derezz voxel explosion & boost sparks
    ├── camera/
    │   └── CameraRig.js    # Manages Bird's-Eye, Over-the-Shoulder, and First-Person views
    ├── logic/
    │   ├── Collision.js    # 2D grid occupancy map + segment intersection checks
    │   └── AIController.js # Raycast + BFS flood-fill + cutoff heuristics
    └── audio/
        └── SynthAudio.js   # Procedural Web Audio API sound effects
```

### Phase Breakdown
- **Phase 1: Core Grid & Physics**: 2D logical grid occupancy array synced with 3D Three.js scene, 90° turn queue, trail segment extrusion, and collision detection.
- **Phase 2: Multi-Camera Rig**: Implement `CameraRig` with smooth interpolation between Bird's-Eye, Over-the-Shoulder, and First-Person modes, plus adaptive input mapping.
- **Phase 3: AI Opponent**: Implement lookahead raycasting, BFS flood-fill survival, and cutoff behavior.
- **Phase 4: Visual Polish & HUD**: UnrealBloom post-processing, cockpit overlay + radar minimap for 1st-person mode, voxel derezz explosions, and Web Audio synth effects.
