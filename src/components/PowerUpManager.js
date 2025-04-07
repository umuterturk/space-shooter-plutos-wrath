import { PowerUp } from './PowerUp.js';

export class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 450; // frames (7.5 seconds at 60fps) - more frequent spawns
        this.types = ['double', 'triple', 'rapid', 'plasma', 'speed', 'health', 'agility', 'thrust', 'godmode', 'nuclear', 'missile'];
    }
    
    update() {
        // Spawn power-ups
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }
        
        // Update all power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.update();
        });
        
        // Remove marked power-ups
        this.powerUps = this.powerUps.filter(powerUp => !powerUp.markedForDeletion);
    }
    
    draw(ctx) {
        this.powerUps.forEach(powerUp => {
            powerUp.draw(ctx);
        });
    }
    
    spawnPowerUp() {
        // Calculate random position at the top of the screen
        const x = Math.random() * (this.game.width - 20);
        const y = -30;
        
        // Choose random power-up type
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        
        // Create and add the power-up
        const powerUp = new PowerUp(this.game, x, y, type);
        this.powerUps.push(powerUp);
    }
    
    // Force spawn a specific power-up (for enemy drops)
    spawnAt(x, y, forcedType = null) {
        // Calculate random position if not specified
        if (x === undefined) {
            x = Math.random() * (this.game.width - 20);
        }
        if (y === undefined) {
            y = -20; // Start above the screen
        }
        
        // Select type (weighted probability)
        let type;
        if (forcedType && this.types.includes(forcedType)) {
            type = forcedType;
        } else {
            // Define power-up types with individual weights
            const powerUpWeights = {
                'double': 20,   // 15%
                'triple': 15,   // 14%
                'rapid': 10,    // 13%
                'plasma': 10,   // 10%
                'speed': 10,    // 10%
                'health': 10,   // 10%
                'agility': 15,   // 7%
                'thrust': 15,    // 7%
                'godmode': 4,   // 4%
                'nuclear': 10,   // 4%
                'missile': 10    // 6%
            };
            
            // Calculate total weight for normalization
            const totalWeight = Object.values(powerUpWeights).reduce((sum, weight) => sum + weight, 0);
            
            // Normalize weights and create probability ranges
            const ranges = [];
            let cumulativeProbability = 0;
            
            for (const [powerUpType, weight] of Object.entries(powerUpWeights)) {
                const normalizedWeight = weight / totalWeight;
                cumulativeProbability += normalizedWeight;
                ranges.push({
                    type: powerUpType,
                    threshold: cumulativeProbability
                });
            }
            
            // Select power-up based on random value and normalized ranges
            const random = Math.random();
            for (const range of ranges) {
                if (random <= range.threshold) {
                    type = range.type;
                    break;
                }
            }
        }
        
        // Create and add power-up
        const powerUp = new PowerUp(this.game, x, y, type);
        this.powerUps.push(powerUp);
    }
    
    reset() {
        this.powerUps = [];
        this.spawnTimer = 0;
    }
} 