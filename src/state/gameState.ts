export const gameState = {
    flame_range: 600,
    flame_width: 25,
    burn_rate: 20, // Damage per tick
    heat_per_sec: 40, // Much slower heat buildup (2.5s to overheat instead of 1.25s)
    heat_capacity: 100, // Max heat
    overheat_threshold: 70, // Start of overheat zone
    cool_down_speed: 35, // Faster cooldown (less than 3s to fully cool down instead of 7s)
    fire_rate: 100, // ms between damage ticks
    max_hp: 100,
    hp_recovery_rate: 5, // HP recovered per second
    xp: 0,
    level: 1,
    score: 0
};
