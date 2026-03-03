# 📂 Skill: Flamix Core Engine
> Role: Expert Game Developer (Phaser 3 + TypeScript).
> Focus: High-performance stationary horde survival.

## 🛠️ Technical Stack & Constraints
- **Framework:** Phaser 3.80+ (Arcade Physics).
- **Architecture:** Class-based (ES6 Modules).
- **Screen:** Fixed Portrait (1080x1920). All coordinates relative to `center (540, 960)`.
- **Performance:** Mandatory use of `Phaser.GameObjects.Group` for enemies and particles (Object Pooling).

## 🎮 Gameplay Logic (Immutable)

### 🧍 Stationary Player
- **Position:** `ALWAYS (540, 960)`. 
- **Interaction:** `input.activePointer` controls `player.rotation`. 
- **Constraint:** Zero velocity/translation. No WASD/Arrows.

### ⚔️ Flame State Machine
The weapon must cycle through these states:
1. `IDLE`: Heat decreases by `cool_down_speed`.
2. `FIRING`: Heat increases. Emit particles. Damage enemies in arc.
3. `OVERHEAT`: Locked state when `heat >= heat_capacity`. Cannot fire.
4. `COOLING`: Mandatory wait until `heat == 0` before returning to `IDLE`.

### 👾 Enemy Horde
- **Spawn:** Random points on a circle with radius > 1200px from center.
- **Pathing:** Linear vector toward `(540, 960)`.
- **Collisions:** - `Enemy vs Flame`: Use `Phaser.Geom.Triangle` or `Arc` for high-performance overlap check.
    - `Enemy vs Player`: Immediate `Scene.restart()` or Game Over.

## ⬆️ Rogue-lite Upgrade Schema
Store these variables in a global `gameState` or `PlayerConfig` object:
- `flame_range`: Default 400px.
- `flame_width`: Default 30 degrees.
- `burn_rate`: Damage per tick.
- `heat_capacity`: Max value of heat meter.
- `cool_down_speed`: Recovery rate per frame.
- `fire_rate`: Milliseconds between damage ticks.

## 🎨 Graphics & UI
- **Background:** Static dark grid (to emphasize movement).
- **Flame:** Particle Emitter with `blendMode: 'ADD'`.
- **HUD:** - XP Bar: Full width at Y=20.
    - Heat Meter: Visual gauge at Y=1800.
    - Upgrade Overlay: Pause Scene + DOM or Layer depth over the game.

## 🤖 AI Coding Instructions
1. Always suggest code that is **modular** (separate files for Player, Enemy, Manager).
2. When creating the Flame, use `Phaser.Geom` for math-based collision (more efficient than 500 physics bodies).
3. Do not include unused Vite boilerplate assets.