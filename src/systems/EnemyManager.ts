import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';

export class EnemyManager {
    private scene: Phaser.Scene;
    private enemies: Phaser.GameObjects.Group;
    private lastSpawnTime: number = 0;
    // Difficulty scaling variables removed to be calculated dynamically

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Create an object pool of enemies
        this.enemies = this.scene.add.group({
            classType: Enemy,
            maxSize: 1000,
            runChildUpdate: false // We will update manually for performance
        });

        // Pre-allocate the pool to avoid stuttering later
        for (let i = 0; i < 500; i++) {
            const enemy = new Enemy(this.scene, 0, 0);
            enemy.setActive(false);
            enemy.setVisible(false);
            this.enemies.add(enemy);
        }

        // Listen for player attacks
        this.scene.events.on('player-fire', this.handlePlayerFire, this);

        // Explode texture for dead enemies
        const gfx = scene.make.graphics({});
        gfx.fillStyle(0xff0000, 1);
        gfx.fillCircle(8, 8, 8);
        gfx.generateTexture('enemyGib', 16, 16);
        gfx.destroy();
    }

    update(time: number, delta: number) {
        const deltaSec = delta / 1000;

        this.handleSpawning(time);
        this.updateActiveEnemies(deltaSec);
    }

    private handleSpawning(time: number) {
        const elapsedSec = time / 1000;
        // Difficulty scales up over 5 minutes (300 sec)
        const difficultyScale = Math.min(elapsedSec / 300, 1);

        // Dynamic stats
        // We want HORDES, but we want them to arrive in streams/waves, not all at the exact same millisecond.
        const currentSpawnRate = Phaser.Math.Linear(3000, 1500, difficultyScale); // Spawn big waves every 1.5s to 3s
        const currentEnemySpeed = Phaser.Math.Linear(40, 180, difficultyScale);
        const currentEnemyHP = Phaser.Math.Linear(10, 150, difficultyScale);

        if (time > this.lastSpawnTime + currentSpawnRate) {
            // BACK TO HORDES: large groups
            const clusterSize = Math.floor(Phaser.Math.Linear(10, 40, difficultyScale));
            const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            for (let i = 0; i < clusterSize; i++) {
                const enemy = this.enemies.getFirstDead(false) as Enemy;
                if (!enemy) break; // Out of pool

                // CRITICAL CHANGE: Drastically vary the spawn distance. 
                // Some spawn at 1200px, others up to 3000px away. 
                // This forces the "horde" to string out into a long column that takes time to arrive.
                const spawnDistance = 1200 + Phaser.Math.FloatBetween(0, 1800);

                // Spread them out in an arc (cone)
                const angleOffset = Phaser.Math.FloatBetween(-0.7, 0.7);
                const finalAngle = baseAngle + angleOffset;

                const x = 540 + Math.cos(finalAngle) * spawnDistance;
                const y = 960 + Math.sin(finalAngle) * spawnDistance;

                // Randomize individual speed heavily so fast ones pull ahead and slow ones fall behind
                const individualSpeed = currentEnemySpeed * Phaser.Math.FloatBetween(0.5, 1.5);

                // Spawn with dynamic stats
                enemy.spawn(x, y, currentEnemyHP, individualSpeed);
            }
            this.lastSpawnTime = time;
        }
    }

    private updateActiveEnemies(deltaSec: number) {
        const activeEnemies = this.enemies.getMatching('active', true) as Enemy[];

        for (const enemy of activeEnemies) {
            // Update position
            enemy.x += enemy.velocityX * deltaSec;
            enemy.y += enemy.velocityY * deltaSec;

            // Check collision (Enemy vs Player)
            // Player is always at (540, 960)
            const distSq = Phaser.Math.Distance.Squared(enemy.x, enemy.y, 540, 960);
            if (distSq < 400) { // 20px threshold radius squared
                this.scene.events.emit('player-hit', { damage: 10 });
                // Remove this enemy without giving XP so it doesn't collide forever
                enemy.killNoXp();
            }
        }
    }

    private handlePlayerFire(data: { x: number, y: number, rotation: number, actual_range: number, actual_width: number, actual_damage: number }) {
        // Compute high-performance Flame Triangle
        const flameTriangle = new Phaser.Geom.Triangle();

        // Apex is the player center
        flameTriangle.x1 = data.x;
        flameTriangle.y1 = data.y;

        // Vertices at the edge of the flame range and width
        const halfWidthRad = Phaser.Math.DegToRad(data.actual_width / 2);

        const endX1 = data.x + Math.cos(data.rotation - halfWidthRad) * data.actual_range;
        const endY1 = data.y + Math.sin(data.rotation - halfWidthRad) * data.actual_range;

        const endX2 = data.x + Math.cos(data.rotation + halfWidthRad) * data.actual_range;
        const endY2 = data.y + Math.sin(data.rotation + halfWidthRad) * data.actual_range;

        flameTriangle.x2 = endX1;
        flameTriangle.y2 = endY1;
        flameTriangle.x3 = endX2;
        flameTriangle.y3 = endY2;

        const activeEnemies = this.enemies.getMatching('active', true) as Enemy[];

        // Perform Triangle.Contains vs 500+ enemies without creating Point objects
        for (const enemy of activeEnemies) {
            if (Phaser.Geom.Triangle.Contains(flameTriangle, enemy.x, enemy.y)) {
                // Apply damage (burn_rate is damage per tick)
                enemy.hp -= data.actual_damage;

                if (enemy.hp <= 0 && enemy.active) {
                    // Spawn explosion particles
                    this.scene.add.particles(enemy.x, enemy.y, 'enemyGib', {
                        speed: { min: 50, max: 200 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 1, end: 0 },
                        lifespan: 300,
                        emitting: false,
                        quantity: 8,
                        duration: 100
                    }).start();

                    enemy.die();
                } else {
                    // Flash enemy white briefly for hit feedback (optional, we skip for performance or do it simple)
                    enemy.fillColor = 0xffffff;
                    this.scene.time.delayedCall(50, () => {
                        if (enemy.active) enemy.fillColor = 0xff0000;
                    });
                }
            }
        }
    }
}
