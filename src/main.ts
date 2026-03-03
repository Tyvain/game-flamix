import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

import { UIScene } from './scenes/UIScene';
import { UpgradeScene } from './scenes/UpgradeScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    // Target fixed portrait orientation
    width: 1080,
    height: 1920,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MainScene, UIScene, UpgradeScene]
};

export default new Phaser.Game(config);
