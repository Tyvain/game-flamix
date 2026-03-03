import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let logs = [];
    page.on('console', msg => logs.push(`Console ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`PageError: ${err.message}`));

    console.log("Navigating to http://localhost:5173/");
    await page.goto('http://localhost:5173/');

    // Wait for the game canvas to render
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log("Game loaded.");

    // Perform interactions: move mouse to canvas center and hold down to shoot
    // Canvas size is likely scaled to fit window, or fixed 1080x1920 inside the body 
    // Wait a few seconds for Phaser to initialize fully and for enemy to spawn
    await page.waitForTimeout(3000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();

    if (box) {
        console.log(`Canvas found at ${box.x}, ${box.y} (${box.width}x${box.height})`);

        // Move to player position (center of the canvas logically is 540x960, but visually it scales)
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        console.log(`Aiming flame to the right`);

        // Move to center to start
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();

        // Drag slightly to the right to aim
        await page.mouse.move(centerX + 100, centerY);

        // Keep firing for 5 seconds to burn enemies
        await page.waitForTimeout(5000);

        await page.mouse.up();

        console.log("Saving screenshot to /tmp/flamix-screenshot.png");
        await page.screenshot({ path: 'C:/Users/saugerleger/.gemini/antigravity/brain/874dec41-5864-4998-8e02-c9c31dfed24b/flamix-screenshot.png' });
    } else {
        console.log("Could not find canvas bounding box");
    }

    console.log("--- BROWSER LOGS ---");
    logs.forEach(l => console.log(l));
    console.log("--------------------");

    await browser.close();
})();
