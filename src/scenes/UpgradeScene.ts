import Phaser from 'phaser';
import { gameState } from '../state/gameState';

export class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        // Overlay background
        this.add.rectangle(540, 960, 1080, 1920, 0x000000, 0.7);

        this.add.text(540, 400, 'LEVEL UP!', { fontSize: '64px', color: '#ffffff' })
            .setOrigin(0.5);

        // Define available upgrades
        const allUpgrades = [
            { text: '+ Flame Range', action: () => gameState.flame_range += 50 },
            { text: '+ Damage Rate', action: () => gameState.burn_rate += 10 },
            { text: '+ Cooling Speed', action: () => gameState.cool_down_speed += 10 },
            { text: '+ Heat Safe Zone', action: () => gameState.overheat_threshold = Math.min(gameState.heat_capacity - 5, gameState.overheat_threshold + 10) },
            { text: '+ Max HP', action: () => gameState.max_hp += 20 },
            { text: '+ HP Regen', action: () => gameState.hp_recovery_rate += 5 }
        ];

        // Pick 3 random upgrades
        Phaser.Utils.Array.Shuffle(allUpgrades);
        const upgrades = allUpgrades.slice(0, 3);

        // Layout options
        upgrades.forEach((upgrade, index) => {
            const y = 700 + index * 150;
            const btn = this.add.rectangle(540, y, 600, 100, 0x00aaff)
                .setInteractive({ useHandCursor: true });

            this.add.text(540, y, upgrade.text, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

            btn.on('pointerdown', () => {
                upgrade.action();
                this.resumeGame();
            });

            // Hover effect
            btn.on('pointerover', () => btn.setFillStyle(0x00ccff));
            btn.on('pointerout', () => btn.setFillStyle(0x00aaff));
        });
    }

    private resumeGame() {
        // Resume main scene
        this.scene.resume('MainScene');
        // Stop upgrade scene overlay
        this.scene.stop();
    }
}
