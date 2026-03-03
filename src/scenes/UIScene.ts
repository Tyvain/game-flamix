import Phaser from 'phaser';
import { gameState } from '../state/gameState';

export class UIScene extends Phaser.Scene {
    // Background properties removed as they are unused variables.
    private xpBarFill!: Phaser.GameObjects.Rectangle;
    private hpBarFill!: Phaser.GameObjects.Rectangle;
    private heatMeterFill!: Phaser.GameObjects.Rectangle;
    private overheatMarker!: Phaser.GameObjects.Rectangle;

    private currentXp: number = 0;
    private xpToNextLevel: number = 100;

    constructor() {
        super({ key: 'UIScene', active: true });
    }

    create() {
        // XP Bar at Y=20
        const barWidth = 1000;
        this.add.rectangle(540, 20, barWidth, 15, 0x333333);
        this.xpBarFill = this.add.rectangle(540 - barWidth / 2, 20, 0, 15, 0x00aaff);
        this.xpBarFill.setOrigin(0, 0.5);

        // HP Bar at Y=45
        this.add.rectangle(540, 45, barWidth, 15, 0x333333);
        this.hpBarFill = this.add.rectangle(540 - barWidth / 2, 45, barWidth, 15, 0x00ff00);
        this.hpBarFill.setOrigin(0, 0.5);

        // Heat Meter at Y=1800
        const heatWidth = 600;
        this.add.rectangle(540, 1800, heatWidth, 30, 0x333333);
        this.heatMeterFill = this.add.rectangle(540 - heatWidth / 2, 1800, 0, 30, 0xffaa00);
        this.heatMeterFill.setOrigin(0, 0.5);

        this.overheatMarker = this.add.rectangle(540, 1800, 8, 40, 0xffffff);
        this.overheatMarker.setStrokeStyle(2, 0x000000);

        // We listen to the MainScene
        const mainScene = this.scene.get('MainScene');
        if (mainScene) {
            mainScene.events.on('heat-state-changed', this.updateHeat, this);
            mainScene.events.on('player-update', this.updateHp, this);
            mainScene.events.on('enemy-died', this.addXp, this);
        }
    }

    private updateHeat(data: { state: number, heat: number }) {
        const fillPercent = Phaser.Math.Clamp(data.heat / gameState.heat_capacity, 0, 1);
        this.heatMeterFill.width = 600 * fillPercent;

        // Update marker position
        const thresholdPercent = gameState.overheat_threshold / gameState.heat_capacity;
        this.overheatMarker.x = (540 - 300) + 600 * thresholdPercent;

        // WeaponState.COOLING is 3
        if (data.state === 3) {
            this.heatMeterFill.fillColor = 0xff0000;
        } else {
            // Interpolate from green to red based on heat percent
            const r = Math.floor(Phaser.Math.Linear(0, 255, fillPercent));
            const g = Math.floor(Phaser.Math.Linear(255, 0, fillPercent));
            this.heatMeterFill.fillColor = Phaser.Display.Color.GetColor(r, g, 0);
        }
    }

    private addXp() {
        this.currentXp += 10;
        if (this.currentXp >= this.xpToNextLevel) {
            this.currentXp = 0;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            // Trigger pause and upgrade
            this.scene.get('MainScene').scene.pause();
            this.scene.launch('UpgradeScene');
        }

        const fillPercent = Phaser.Math.Clamp(this.currentXp / this.xpToNextLevel, 0, 1);
        this.xpBarFill.width = 1000 * fillPercent;
    }

    private updateHp(data: { hp: number }) {
        const fillPercent = Phaser.Math.Clamp(data.hp / gameState.max_hp, 0, 1);
        this.hpBarFill.width = 1000 * fillPercent;

        // Color feedback based on life remaining
        if (fillPercent > 0.5) this.hpBarFill.fillColor = 0x00ff00;
        else if (fillPercent > 0.25) this.hpBarFill.fillColor = 0xffff00;
        else this.hpBarFill.fillColor = 0xff0000;
    }
}
