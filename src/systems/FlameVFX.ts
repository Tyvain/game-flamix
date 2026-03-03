import Phaser from 'phaser';

export class FlameVFX {
    private scene: Phaser.Scene;
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private coneGraphic: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        this.coneGraphic = scene.add.graphics();
        this.coneGraphic.setBlendMode(Phaser.BlendModes.ADD);

        // Create a simple particle graphic in code
        const graphics = scene.make.graphics({});
        graphics.fillStyle(0xffffff, 1); // White center for additive burning
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('flameParticle', 20, 20);
        graphics.destroy();

        // Create the emitter
        this.emitter = this.scene.add.particles(540, 960, 'flameParticle', {
            lifespan: 500, // Longer lifespan (0.5s) for a slower, smoother flame projection
            speed: { min: 0, max: 0 },
            angle: { min: -15, max: 15 },
            scale: { start: 0.1, end: 2.0 }, // Starts tiny, grows huge
            alpha: { start: 0.8, end: 0 },
            tint: [0xffff00, 0xff8800, 0xff0000],
            blendMode: 'ADD',
            emitting: false,
            frequency: 10
        });

        // The FlameVFX listens to the Player updating
        this.scene.events.on('player-update', this.handleUpdate, this);
        this.scene.events.on('heat-state-changed', this.handleStateChange, this);
    }

    private handleUpdate(data: { x: number, y: number, rotation: number, state: number, actual_range: number, current_range: number, actual_width: number, isOverheating: boolean }) {
        // Position the emitter at the player and rotate the *entire* particle system
        this.emitter.setPosition(data.x, data.y);
        this.emitter.rotation = data.rotation;

        // Since lifespan is 500ms (0.5s), Maximum Speed = current visual distance / 0.5
        // This ensures particles 'travel' within the growing boundary
        const currentParticleRange = Math.max(10, data.current_range);
        const maxSpeed = currentParticleRange / 0.5;
        // @ts-ignore
        this.emitter.particleSpeed = { min: maxSpeed * 0.5, max: maxSpeed };

        // Update the angle of the emitter to exactly match the width upgrade
        const halfWidth = data.actual_width / 2;
        // @ts-ignore
        this.emitter.particleAngle = { min: -halfWidth, max: halfWidth };

        // Draw hit area visually
        this.coneGraphic.clear();

        const baseAlpha = 0.05;
        const firingAlpha = data.isOverheating ? 0.3 : 0.2;
        const color = data.isOverheating ? 0xff5500 : 0xffaa00;

        // 1. Transparent guide cone (always visible at MAX range to guide the player)
        this.coneGraphic.fillStyle(0xffaa00, baseAlpha);
        this.coneGraphic.beginPath();
        this.coneGraphic.moveTo(data.x, data.y);
        const halfRad = Phaser.Math.DegToRad(halfWidth);
        this.coneGraphic.arc(data.x, data.y, data.actual_range, data.rotation - halfRad, data.rotation + halfRad, false);
        this.coneGraphic.closePath();
        this.coneGraphic.fillPath();

        // 2. Progressive bright cone is now visually drawn exactly up to the current bound
        if (data.current_range > 5) {
            this.coneGraphic.fillStyle(color, firingAlpha);
            this.coneGraphic.beginPath();
            this.coneGraphic.moveTo(data.x, data.y);
            this.coneGraphic.arc(data.x, data.y, data.current_range, data.rotation - halfRad, data.rotation + halfRad, false);
            this.coneGraphic.closePath();
            this.coneGraphic.fillPath();
        }
    }

    private handleStateChange(data: { state: number }) {
        // WeaponState.FIRING is 1
        if (data.state === 1) {
            this.emitter.start();
        } else {
            this.emitter.stop();
        }
    }
}
