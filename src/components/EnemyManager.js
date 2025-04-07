import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';

export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.boss = null;
        
        // Wave system
        this.currentWave = 1;
        this.waveDuration = 900; // 15 seconds at 60fps
        this.waveTimer = 0;
        this.waveActive = true;
        this.waveEndTimer = 0;
        this.waveEndDelay = 180; // 3 seconds between waves
        
        // Spawn control
        this.spawnTimer = 0;
        this.maxEnemies = 15; // Increased starting number of max enemies
        this.spawnInterval = 60; // Faster initial spawn interval
        
        // Wave announcement
        this.showWaveText = false;
        this.waveTextTimer = 0;
        this.waveTextDuration = 180; // 3 seconds
    }
    
    update(deltaTime) {
        // Update boss if present
        if (this.boss) {
            this.boss.update();
            
            // Check if boss is defeated
            if (this.boss.markedForDeletion) {
                // Add special explosion effect
                this.game.effectsManager.createExplosion(
                    this.boss.x + this.boss.width/2, 
                    this.boss.y + this.boss.height/2,
                    this.boss.width
                );
                
                // Add big screen shake
                this.game.addScreenShake(15, 60);
                
                // Add score
                this.game.score += this.boss.score;
                
                // Drop multiple power-ups
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const offsetX = (Math.random() - 0.5) * 100;
                        const offsetY = (Math.random() - 0.5) * 50;
                        this.game.powerUpManager.spawnAt(
                            this.boss.x + this.boss.width/2 + offsetX,
                            this.boss.y + this.boss.height/2 + offsetY
                        );
                    }, i * 300);
                }
                
                // Show notification
                this.game.notificationManager.addNotification('BOSS DEFEATED!', '#FF9900', 180);
                
                // Set boss to null
                this.boss = null;
                
                // Start next wave immediately
                this.startNewWave();
            }
        }
        
        // Only spawn regular enemies if there's no boss
        if (!this.boss && this.waveActive) {
            // Spawn enemies
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.getMaxEnemiesForWave()) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }
        
        // Update all enemies
        this.enemies.forEach(enemy => {
            enemy.update();
        });
        
        // Remove marked enemies
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        
        // Update wave timer
        if (this.waveActive) {
            this.waveTimer++;
            
            // End wave when timer expires
            if (this.waveTimer >= this.waveDuration) {
                this.endWave();
            }
        } else {
            // Between waves, count down to next wave
            this.waveEndTimer++;
            if (this.waveEndTimer >= this.waveEndDelay) {
                this.startNewWave();
            }
        }
        
        // Update wave text timer
        if (this.showWaveText) {
            this.waveTextTimer++;
            if (this.waveTextTimer >= this.waveTextDuration) {
                this.showWaveText = false;
            }
        }
    }
    
    draw(ctx) {
        // Draw all enemies
        this.enemies.forEach(enemy => {
            enemy.draw(ctx);
        });
        
        // Draw boss if present
        if (this.boss) {
            this.boss.draw(ctx);
        }
        
        // Draw wave announcement
        if (this.showWaveText) {
            ctx.save();
            
            // Calculate fade
            let alpha = 1;
            if (this.waveTextTimer < 30) {
                alpha = this.waveTextTimer / 30;
            } else if (this.waveTextTimer > this.waveTextDuration - 30) {
                alpha = (this.waveTextDuration - this.waveTextTimer) / 30;
            }
            
            ctx.globalAlpha = alpha;
            
            // Wave text
            const isBossWave = this.currentWave % 10 === 0;
            const text = isBossWave ? `BOSS WAVE ${this.currentWave}` : `WAVE ${this.currentWave}`;
            const yPos = isBossWave ? this.game.height / 2 - 20 : this.game.height / 2;
            
            // Draw text background
            ctx.fillStyle = isBossWave ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
                this.game.width / 2 - 150,
                yPos - 40,
                300,
                80
            );
            
            // Draw text border
            ctx.strokeStyle = isBossWave ? '#FF0000' : '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                this.game.width / 2 - 150,
                yPos - 40,
                300,
                80
            );
            
            // Draw wave text
            ctx.font = isBossWave ? '30px "Press Start 2P", monospace' : '24px "Press Start 2P", monospace';
            ctx.fillStyle = isBossWave ? '#FF3300' : '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, this.game.width / 2, yPos);
            
            // Draw boss warning
            if (isBossWave) {
                ctx.font = '16px "Press Start 2P", monospace';
                ctx.fillText('WARNING!', this.game.width / 2, yPos + 30);
            }
            
            ctx.restore();
        }
    }
    
    startNewWave() {
        // Increment wave counter
        this.currentWave++;
        
        // Reset wave state
        this.waveActive = true;
        this.waveTimer = 0;
        this.waveEndTimer = 0;
        this.showWaveText = true;
        this.waveTextTimer = 0;
        
        // Clear any remaining enemies
        this.enemies = [];
        
        // Every 10th wave is a boss wave
        if (this.currentWave % 10 === 0) {
            // Spawn boss
            this.spawnBoss();
        } else {
            // Spawn initial wave formation
            this.spawnWaveFormation();
        }
        
        // Announce new wave
        const isBossWave = this.currentWave % 10 === 0;
        const message = isBossWave ? 'BOSS WAVE!' : `WAVE ${this.currentWave}`;
        const color = isBossWave ? '#FF0000' : '#FFFFFF';
        this.game.notificationManager.addNotification(message, color, 180);
    }
    
    endWave() {
        // Mark wave as inactive
        this.waveActive = false;
        
        // Start countdown to next wave
        this.waveEndTimer = 0;
        
        // Clear any remaining enemies with a special effect
        this.destroyAllEnemies();
        
        // Show notification for wave end
        if (this.currentWave % 10 !== 9) { // Don't show before boss wave
            this.game.notificationManager.addNotification('WAVE COMPLETE', '#00FF00', 120);
        } else {
            // Prepare for boss wave
            this.game.notificationManager.addNotification('BOSS INCOMING', '#FF0000', 120);
        }
    }
    
    spawnEnemy() {
        // Calculate random position at the top of the screen
        const x = Math.random() * (this.game.width - 48);
        const y = -50;
        
        // Determine enemy type based on wave level
        let type;
        const random = Math.random() * 100;
        
        // Adjust enemy type probability based on wave number to make higher waves more challenging
        if (this.currentWave < 3) {
            // Mostly small enemies in early waves
            type = random < 85 ? 'small' : 'medium';
        } else if (this.currentWave < 5) {
            // More medium enemies in middle waves
            if (random < 60) type = 'small';
            else if (random < 95) type = 'medium';
            else type = 'large';
        } else if (this.currentWave < 8) {
            // Tougher mix in later waves
            if (random < 40) type = 'small';
            else if (random < 80) type = 'medium';
            else type = 'large';
        } else {
            // Mostly tough enemies in high waves
            if (random < 25) type = 'small';
            else if (random < 65) type = 'medium';
            else type = 'large';
        }
        
        // Create and add the enemy with scaled stats based on wave
        const enemy = new Enemy(this.game, x, y, type, this.getEnemyScale());
        this.enemies.push(enemy);
    }
    
    spawnWaveFormation() {
        // Choose formation based on wave number
        const formationTypes = ['line', 'v', 'circle', 'grid'];
        const formationIndex = (this.currentWave - 1) % formationTypes.length;
        const formationType = formationTypes[formationIndex];
        
        switch(formationType) {
            case 'line':
                this.spawnLineFormation();
                break;
            case 'v':
                this.spawnVFormation();
                break;
            case 'circle':
                this.spawnCircleFormation();
                break;
            case 'grid':
                this.spawnGridFormation();
                break;
        }
    }
    
    spawnLineFormation() {
        const count = 8 + Math.min(6, Math.floor(this.currentWave / 2));
        
        for (let i = 0; i < count; i++) {
            const x = (this.game.width / count) * i + (this.game.width / count / 2) - 12;
            const enemy = new Enemy(this.game, x, -50 - (i * 20), 'small', this.getEnemyScale());
            this.enemies.push(enemy);
        }
    }
    
    spawnVFormation() {
        const rows = 4 + Math.min(4, Math.floor(this.currentWave / 3));
        
        for (let i = 0; i < rows; i++) {
            // Left side
            const leftX = (this.game.width / 2) - 40 - (i * 30);
            const leftY = -50 - (i * 20);
            
            // Right side
            const rightX = (this.game.width / 2) + 40 + (i * 30);
            const rightY = -50 - (i * 20);
            
            // Alternate enemy types
            const enemyTypeIndex = i % 3;
            const enemyType = ['small', 'medium', 'large'][enemyTypeIndex];
            
            this.enemies.push(new Enemy(this.game, leftX, leftY, enemyType, this.getEnemyScale()));
            this.enemies.push(new Enemy(this.game, rightX, rightY, enemyType, this.getEnemyScale()));
        }
    }
    
    spawnCircleFormation() {
        // Center enemy
        const centerX = this.game.width / 2 - 24;
        const centerY = -100;
        this.enemies.push(new Enemy(this.game, centerX, centerY, 'large', this.getEnemyScale()));
        
        // Surrounding enemies
        const count = 8 + Math.min(6, Math.floor(this.currentWave / 2));
        const radius = 80 + (this.currentWave * 3);
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Add variation to enemy types in circle
            const enemyType = (i % 3 === 0) ? 'medium' : 'small';
            this.enemies.push(new Enemy(this.game, x, y, enemyType, this.getEnemyScale()));
        }
        
        // Add a second, outer circle for higher waves
        if (this.currentWave > 3) {
            const outerRadius = radius + 60;
            const outerCount = count + 4;
            
            for (let i = 0; i < outerCount; i++) {
                const angle = (Math.PI * 2 / outerCount) * i + (Math.PI / outerCount); // Offset to alternate
                const x = centerX + Math.cos(angle) * outerRadius;
                const y = centerY + Math.sin(angle) * outerRadius;
                this.enemies.push(new Enemy(this.game, x, y, 'small', this.getEnemyScale()));
            }
        }
    }
    
    spawnGridFormation() {
        const rows = 3 + Math.min(3, Math.floor(this.currentWave / 4));
        const cols = 4 + Math.min(3, Math.floor(this.currentWave / 3));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * (this.game.width / cols) + 50;
                const y = -150 + (row * 40);
                
                // More varied enemy types in higher waves
                let enemyType;
                if (this.currentWave < 4) {
                    // Checkerboard pattern of small and medium
                    enemyType = (row + col) % 2 === 0 ? 'small' : 'medium';
                } else {
                    // Mix in large enemies in higher waves
                    const typeRoll = (row + col) % 3;
                    enemyType = typeRoll === 0 ? 'small' : (typeRoll === 1 ? 'medium' : 'large');
                }
                
                this.enemies.push(new Enemy(this.game, x, y, enemyType, this.getEnemyScale()));
            }
        }
    }
    
    spawnBoss() {
        // Create boss in the center top
        const bossX = this.game.width / 2 - 75; // Assuming boss is 150px wide
        const bossY = -150;
        
        // Create boss with level based on current wave
        const bossLevel = Math.floor(this.currentWave / 10);
        this.boss = new Boss(this.game, bossX, bossY, bossLevel);
    }
    
    getMaxEnemiesForWave() {
        // Significantly increase max enemies based on wave number
        return 15 + Math.min(40, Math.floor(this.currentWave * 2.5));
    }
    
    getSpawnIntervalForWave() {
        // Faster spawn rate that scales with wave number
        return Math.max(15, 60 - (this.currentWave * 3));
    }
    
    getEnemyScale() {
        // Scale enemy stats based on wave number
        return {
            healthMultiplier: 1 + (this.currentWave * 0.08),
            speedMultiplier: 1 + (this.currentWave * 0.04),
            scoreMultiplier: 1 + (this.currentWave * 0.2)
        };
    }
    
    // Add a method to destroy all enemies
    destroyAllEnemies(excludeBoss = false) {
        let enemyCount = this.enemies.length;
        
        // Apply destroy effects to each enemy
        this.enemies.forEach((enemy, index) => {
            // Add small explosion at each enemy position, with staggered timing
            setTimeout(() => {
                if (this.game && this.game.effectsManager) {
                    this.game.effectsManager.createExplosion(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2,
                        enemy.width
                    );
                }
            }, index * 50); // Stagger explosions for better visual effect
        });
        
        // Clear all enemies
        this.enemies = [];
        
        // Handle boss if present
        if (this.boss && !excludeBoss) {
            // Also destroy boss if not excluded
            if (this.game && this.game.effectsManager) {
                this.game.effectsManager.createExplosion(
                    this.boss.x + this.boss.width/2,
                    this.boss.y + this.boss.height/2,
                    this.boss.width,
                    '#FF0000'
                );
            }
            
            // Count boss as destroyed
            enemyCount++;
            
            // Remove boss
            this.boss = null;
        }
        
        // Return count of enemies destroyed for score
        return enemyCount;
    }
    
    reset() {
        this.enemies = [];
        this.boss = null;
        this.currentWave = 0; // Start with wave 1 after reset
        this.waveActive = false;
        this.waveTimer = 0;
        this.waveEndTimer = 0;
        this.spawnTimer = 0;
        this.showWaveText = false;
        
        // Start first wave immediately
        this.startNewWave();
    }
} 