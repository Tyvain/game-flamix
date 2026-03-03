import Phaser from 'phaser';

export class Enemy extends Phaser.GameObjects.Arc {
    public hp: number = 0;
    public velocityX: number = 0;
    public velocityY: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Red circle for enemy
        super(scene, x, y, 6, 0, 360, false, 0xff0000);
        scene.add.existing(this);
    }

    spawn(x: number, y: number, hp: number, speed: number) {
        this.setPosition(x, y);
        this.hp = hp;

        // Calculate velocity vector towards center (540, 960)
        const angle = Phaser.Math.Angle.Between(x, y, 540, 960);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        this.setActive(true);
        this.setVisible(true);
    }

    die() {
        this.killNoXp();
        this.scene.events.emit('enemy-died', this.x, this.y);
    }

    killNoXp() {
        this.setActive(false);
        this.setVisible(false);
    }
}
