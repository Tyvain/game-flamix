import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyManager } from '../systems/EnemyManager';
import { FlameVFX } from '../systems/FlameVFX';

export class MainScene extends Phaser.Scene {
    private player!: Player;
    private enemyManager!: EnemyManager;

    constructor() {
        super('MainScene');
    }

    create() {
        // Draw a basic background grid to emphasize movement later
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x222222, 1);
        for (let i = 0; i < 1080; i += 50) {
            graphics.moveTo(i, 0);
            graphics.lineTo(i, 1920);
        }
        for (let i = 0; i < 1920; i += 50) {
            graphics.moveTo(0, i);
            graphics.lineTo(1080, i);
        }
        graphics.strokePath();

        // Instantiate systems and entities
        this.enemyManager = new EnemyManager(this);
        // We instantiate FlameVFX before the Player so the particles can render under or over the canon as needed
        new FlameVFX(this);
        this.player = new Player(this);

        // Put the player above enemies if needed by depth
        this.player.setDepth(10);
    }

    update(time: number, delta: number) {
        // The MainScene centrally updates logic each frame
        this.player.update(time, delta);
        this.enemyManager.update(time, delta);
    }
}
