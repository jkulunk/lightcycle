# TRON: LIGHT CYCLE — 3D Grid Arena (LEGO 1982 Edition)

A single-player 3D WebGL **TRON Light Cycle** arena game inspired by the classic 1982 *TRON* motion picture (Syd Mead / MAGI Synthavision aesthetic), featuring **3D LEGO Minifigure riders**, a **4-stage Handheld Control Rod intro sequence**, **Three.js `UnrealBloomPass` neon post-processing**, **three live-switchable camera perspectives**, and a **procedural 1982 Wendy Carlos-style Web Audio synthesizer**.

---

## Key Features

### 1. Three Single-Player Game Modes
- **1v1 Grid Duel**: Classic head-to-head showdown — Player (**Cyan**) vs. CPU (**Orange**).
- **4-Bike Grid Battle**: Free-for-all survival against **3 simultaneous AI rivals** (**Orange**, **Yellow**, and **Crimson**) with symmetric 1982 octagonal data obelisk obstacles.
- **Endless Gauntlet Waves**: Escalating survival waves (`WAVE 1`, `WAVE 2`, `WAVE 3`+) that add more AI cycles, higher AI intelligence, and denser arena obstacles with every wave cleared.

### 2. Three Live-Switchable Camera Perspectives (`1` / `2` / `3` or `C`)
- **`[1]` Bird's-Eye View (Default)**: High-altitude tactical overview (`FOV 56°`, `Y = 205`) with 4-way cardinal steering (`W/A/S/D` or `Arrow Keys`).
- **`[2]` Over-the-Shoulder Chase Cam**: Spring-damped 3rd-person pursuit camera with banking roll during 90° snap-turns and dynamic FOV punch when boosting.
- **`[3]` First-Person Canopy Cockpit**: Unobstructed helmet-visor perspective with a full **Tactical Cockpit HUD** (Left/Right blind-spot ultrasonic clearance meters, forward laser rangefinder, turn advisor prompts, compass heading tape, and relative CPU bearing tracker).

### 3. Authentic 1982 Syd Mead Light Cycles & 3D LEGO Minifigures
- **4-Stage Handheld Control Rod Intro Sequence**:
  1. **Stage 1**: LEGO Minifigure stands on the Grid holding the glowing Control Rod across the chest and raises it overhead.
  2. **Stage 2**: LEGO Minifigure sprints forward, leaps into the air, and splits the Control Rod into left/right handlebars, locking into the leaning riding posture *before* the cycle appears.
  3. **Stage 3**: The 1982 Light Cycle materializes around the rider (hubless wheel rings, wireframe shell, laser scan-plane sweep, solid enclosed wheel shrouds, and hinged smoked canopy closing down).
  4. **Stage 4**: Touchdown shockwave and immediate launch into the Grid.
- **LEGO Minifigure Derezz & Victory**: Crashing shatters the cycle into tumbling 3D LEGO bricks and studs. Winning triggers a close-up orbit camera as the canopy pops open and your LEGO Minifigure stands up to cheer with the Control Rod.

### 4. Grid Power-Ups, Speed Brake & 1982 "Off the Grid" Wall Breach
- **Energy Overcharge (Green Octahedron)**: Restores **100% Turbine Boost energy**.
- **Phase-Shift Cloak (Magenta Octahedron)**: Grants **3.5s of Ghost Invulnerability** to pass cleanly through jetwalls and arena obstacles.
- **Trail Eraser EMP (Gold Octahedron)**: Vaporizes all active light-ribbon jetwalls across the Grid.
- **Speed Brake (`S` / `Down Arrow` / `X`)**: Downshifts from `142 KM/H` to `86 KM/H` for tight corridor maneuvering or baiting AI opponents into overshooting a turn.
- **1982 "Off the Grid" Escape Breach**: Ramming the outer perimeter wall while actively **Boosting (`Shift` / `Space`) with ≥ 35% Boost energy** shatters the outer arena wall, creating a glowing escape portal and winning the round.

### 5. Procedural Web Audio Synthesizer (`SynthAudio.js`)
- Zero external audio assets required — 100% generated in real time via the browser's Web Audio API:
  - **1982 Wendy Carlos-style D-Minor Arpeggiated Synth Score** that dynamically scales intensity when close to enemy trails.
  - Pitch-shifted turbine engine hum, speed brake downshift, 90° turn chirp, rod ignition sweep, wireframe rez arpeggio, power-up chimes, wall breach boom, victory fanfare, and derezz noise burst.
  - Toggleable anytime in the Start Menu, top HUD (`SOUND: ON/OFF`), or with the **`M`** key.

---

## Keyboard Controls

| Action | Bird's-Eye View (`[1]`) | Over-Shoulder (`[2]`) & First-Person (`[3]`) |
| :--- | :--- | :--- |
| **Steer / Turn** | `W`/`A`/`S`/`D` or `Arrow Keys` (Cardinal N/W/S/E) | `A` / `Left Arrow` (Turn 90° Left)<br>`D` / `Right Arrow` (Turn 90° Right) |
| **Turbine Boost** | `Shift` or `Space` | `W`, `Up Arrow`, `Shift`, or `Space` |
| **Speed Brake** | `X` | `S`, `Down Arrow`, or `X` |
| **Camera View** | `1` (Bird's-Eye), `2` (Over-Shoulder), `3` (First-Person), or `C` (Cycle View) | Same |
| **Pause & Orbit Cam** | `P` or `Esc` (Use `A`/`D` or `Left`/`Right` to orbit 360° while paused) | Same |
| **Sound ON / OFF** | `M` | `M` |
| **Next Round** | `Space` or `Enter` (on Round Over screen) | Same |

---

## Running the Game Locally

No build server or installation is required to play — `index.html` is pre-bundled with local scripts so it runs directly in any modern browser:

1. **Direct Double-Click / Open**:
   Open `index.html` directly in Safari, Chrome, Firefox, or Edge.
2. **Optional Local HTTP Server**:
   ```bash
   python3 -m http.server 8080
   # Then open http://localhost:8080
   ```

Also included:
- **`storyboard.html`**: Interactive 6-panel neon vector storyboard and architectural breakdown of the game's camera perspectives and Handheld Control Rod intro sequence.

---

## Project Structure

```text
lightcycle/
├── index.html                  # Main game entry point, HUD overlays & modals
├── style.css                   # Cyberpunk neon UI styling, CRT scanlines & Cockpit HUD
├── storyboard.html             # Self-contained 6-panel visual storyboard & architecture spec
├── storyboard.svg              # Standalone vector storyboard illustration
├── three.min.js                # Local Three.js r128 WebGL library
├── three.postprocessing.js     # EffectComposer, RenderPass, UnrealBloomPass & shaders
├── game.bundle.js              # Bundled single-file runtime for zero-CORS file:// execution
└── src/                        # Modular ES source files
    ├── main.js                 # Game state machine, HUD telemetry, mode manager & loop
    ├── audio/
    │   └── SynthAudio.js       # Procedural Web Audio API sound effects & 1982 synth music
    ├── camera/
    │   └── CameraRig.js        # Bird's-Eye, Over-Shoulder, First-Person, Pause & Victory cams
    ├── logic/
    │   ├── AIController.js     # Multi-bike AI lookahead, flood-fill, cutoff & power-up seeker
    │   └── Collision.js        # 2D line-segment collision, obstacle checks & laser raycasting
    └── scene/
        ├── GridArena.js        # Reflective 200x200 Grid, data obelisks, power-ups & wall breaches
        ├── IntroSequence.js    # 4-stage Handheld Control Rod initialization choreography
        ├── LightCycle.js       # 3D LEGO Minifigure rider & 1982 Syd Mead Light Cycle builder
        └── Particles.js        # 3D LEGO brick/stud derezz explosions, boost sparks & bursts
```

### Re-bundling `game.bundle.js` After Editing `src/`
If you modify any file inside `src/`, regenerate `game.bundle.js` with:
```bash
python3 -c '
import re
files = [
    "src/audio/SynthAudio.js",
    "src/scene/GridArena.js",
    "src/scene/LightCycle.js",
    "src/scene/Particles.js",
    "src/camera/CameraRig.js",
    "src/scene/IntroSequence.js",
    "src/logic/Collision.js",
    "src/logic/AIController.js",
    "src/main.js"
]
bundle = ["(function() {\n\"use strict\";\n"]
for f in files:
    with open(f, "r") as fp:
        code = fp.read()
    code = re.sub(r"^\s*import\s+.*?;?\s*$", "", code, flags=re.MULTILINE)
    code = re.sub(r"\bexport\s+(class|const|function)\b", r"\1", code)
    bundle.append(f"// --- {f} ---\n" + code + "\n")
bundle.append("})();\n")
with open("game.bundle.js", "w") as out:
    out.write("\n".join(bundle))
'
```
