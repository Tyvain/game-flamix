import Phaser from 'phaser';
import { gameState } from '../state/gameState';

export enum WeaponState {
    IDLE,
    FIRING,
    OVERHEAT,
    COOLING
}

export class Player extends Phaser.GameObjects.Container {
    private heat: number = 0;
    private hp: number = 100;
    private weaponState: WeaponState = WeaponState.IDLE;
    private lastFireTime: number = 0;
    private current_range: number = 0;

    constructor(scene: Phaser.Scene) {
        // Player is always at the center of the 1080x1920 screen
        super(scene, 540, 960);

        this.hp = gameState.max_hp;

        // Simple visual representation of the player and weapon
        const body = scene.add.circle(0, 0, 15, 0x00ff00);
        const canon = scene.add.rectangle(15, 0, 20, 6, 0x555555);
        this.add([body, canon]);

        // Add to scene display list
        scene.add.existing(this);

        this.scene.events.on('player-hit', this.handleHit, this);
    }

    update(time: number, delta: number) {
        const deltaSec = delta / 1000;

        if (this.hp > 0 && this.hp < gameState.max_hp) {
            this.hp = Math.min(gameState.max_hp, this.hp + gameState.hp_recovery_rate * deltaSec);
        }

        this.handleRotation();
        this.handleHeatStateMachine(time, deltaSec);

        const isOverheating = this.heat >= gameState.overheat_threshold && this.weaponState !== WeaponState.COOLING;
        const actual_range = gameState.flame_range * (isOverheating ? 1.5 : 1);
        const actual_width = gameState.flame_width;

        // Progressive range logic (grows when firing, shrinks when idle)
        const targetRange = this.weaponState === WeaponState.FIRING ? actual_range : 0;
        this.current_range += (targetRange - this.current_range) * 0.08 * (deltaSec * 60);

        // Always emit position/rotation so VFX and UI can lock on instantly
        this.scene.events.emit('player-update', {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            state: this.weaponState,
            hp: this.hp,
            actual_range,
            current_range: this.current_range,
            actual_width,
            isOverheating
        });
    }

    private handleHit(data: { damage: number }) {
        if (this.hp <= 0) return;
        this.hp -= data.damage;
        if (this.hp <= 0) {
            this.scene.events.emit('game-over');
            this.scene.scene.restart();
        }
    }

    private handleRotation() {
        const pointer = this.scene.input.activePointer;
        // The player is always fixed at (540, 960)
        // Instant rotation towards the pointer in world space
        this.rotation = Phaser.Math.Angle.Between(540, 960, pointer.worldX, pointer.worldY);
    }

    private handleHeatStateMachine(time: number, deltaSec: number) {
        const pointer = this.scene.input.activePointer;
        const isOverheating = this.heat >= gameState.overheat_threshold;

        switch (this.weaponState) {
            case WeaponState.IDLE:
                // Cool down over time
                this.heat = Math.max(0, this.heat - gameState.cool_down_speed * deltaSec);

                // IF pointer down AND limit not reached -> Fire
                if (pointer.isDown && this.heat < gameState.heat_capacity) {
                    this.weaponState = WeaponState.FIRING;
                    this.emitStateChange();
                }
                break;

            case WeaponState.FIRING:
                // Stop firing if pointer is released
                if (!pointer.isDown) {
                    this.weaponState = WeaponState.IDLE;
                    this.emitStateChange();
                    break;
                }

                // Increase heat while firing, faster if overheating
                const heatRate = isOverheating ? gameState.heat_per_sec * 1.5 : gameState.heat_per_sec;
                this.heat += heatRate * deltaSec;

                // Fire logic ticks
                if (time > this.lastFireTime + gameState.fire_rate) {
                    this.fire(isOverheating);
                    this.lastFireTime = time;
                }

                // Check for max heat (lockout)
                if (this.heat >= gameState.heat_capacity) {
                    this.heat = gameState.heat_capacity;
                    this.weaponState = WeaponState.COOLING;
                    this.emitStateChange();
                }
                break;

            case WeaponState.OVERHEAT:
                this.weaponState = WeaponState.COOLING;
                this.emitStateChange();
                break;

            case WeaponState.COOLING:
                // Cooling down, user cannot fire even if clicking. Must return to safe zone
                this.heat = Math.max(0, this.heat - gameState.cool_down_speed * deltaSec);

                if (this.heat <= gameState.overheat_threshold) { // Re-entered Safe zone
                    this.weaponState = WeaponState.IDLE;
                    this.emitStateChange();
                }
                break;
        }

        // Always emit the heat change so the UI updates smoothly
        this.emitStateChange();
    }

    private fire(isOverheating: boolean) {
        const actual_damage = gameState.burn_rate * (isOverheating ? 2 : 1);
        const actual_width = gameState.flame_width;

        // Emit an event so the EnemyManager can perform triangle collision
        // We pass current_range so collision is based on the visible growing flame!
        this.scene.events.emit('player-fire', {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            actual_range: this.current_range,
            actual_width,
            actual_damage
        });
    }

    private emitStateChange() {
        // Update the HUD
        this.scene.events.emit('heat-state-changed', {
            state: this.weaponState,
            heat: this.heat
        });
    }
}
