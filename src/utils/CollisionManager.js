export class CollisionManager {
    constructor(game) {
        this.game = game;
    }
    
    checkCollisions() {
        const player = this.game.player;
        const enemies = this.game.enemyManager.enemies;
        const boss = this.game.enemyManager.boss;
        const powerUps = this.game.powerUpManager.powerUps;
        
        // Check player projectiles against enemies
        player.gun.projectiles.forEach((projectile, projectileIndex) => {
            // Check against regular enemies
            enemies.forEach(enemy => {
                if (this.checkRectangleCollision(projectile, enemy)) {
                    // Remove projectile
                    player.gun.projectiles.splice(projectileIndex, 1);
                    
                    // Create hit effect at the impact point
                    this.game.effectsManager.createHitEffect(
                        projectile.x + projectile.width/2,
                        projectile.y + projectile.height/2,
                        15,
                        '#FF6666' // Red hit effect for enemies
                    );
                    
                    // Damage enemy
                    const destroyed = enemy.hit(projectile.damage);
                    
                    // Create explosion when enemy is destroyed
                    if (destroyed) {
                        // Create explosion at enemy center
                        this.game.effectsManager.createExplosion(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2,
                            enemy.width
                        );
                        
                        // Add screen shake based on enemy size
                        let intensity, duration;
                        switch(enemy.type) {
                            case 'small':
                                intensity = 3;
                                duration = 5;
                                break;
                            case 'medium':
                                intensity = 5;
                                duration = 8;
                                break;
                            case 'large':
                                intensity = 8;
                                duration = 12;
                                break;
                            default:
                                intensity = 4;
                                duration = 7;
                        }
                        this.game.addScreenShake(intensity, duration);
                        
                        // Chance to drop power-up when enemy is destroyed
                        if (Math.random() < 0.2) {
                            this.game.powerUpManager.spawnAt(enemy.x + enemy.width / 2 - 10, enemy.y);
                        }
                    }
                    
                    return; // Skip checking further enemies for this projectile
                }
            });
            
            // Check against boss
            if (boss && !player.gun.projectiles[projectileIndex]?.markedForDeletion) {
                if (this.checkRectangleCollision(projectile, boss)) {
                    // Remove projectile
                    player.gun.projectiles.splice(projectileIndex, 1);
                    
                    // Create hit effect at the impact point
                    this.game.effectsManager.createHitEffect(
                        projectile.x + projectile.width/2,
                        projectile.y + projectile.height/2,
                        20,
                        '#FF3333' // Intense red for boss hits
                    );
                    
                    // Damage boss
                    boss.hit(projectile.damage);
                }
            }
        });
        
        // Check player against enemies
        if (!player.invulnerable) {
            // Regular enemies
            enemies.forEach(enemy => {
                if (this.checkRectangleCollision(player, enemy)) {
                    // Player takes damage
                    player.hit();
                    
                    // Enemy takes damage based on player's current speed
                    const playerSpeed = Math.hypot(player.velocityX, player.velocityY);
                    const collisionDamage = Math.floor(20 + playerSpeed * 5); // Base damage + speed bonus
                    const destroyed = enemy.hit(collisionDamage);
                    
                    // Create hit effect at the collision point
                    this.game.effectsManager.createHitEffect(
                        (player.x + player.width/2 + enemy.x + enemy.width/2) / 2,
                        (player.y + player.height/2 + enemy.y + enemy.height/2) / 2,
                        25,
                        '#FF5500' // Orange collision effect
                    );
                    
                    // If enemy was destroyed by the collision
                    if (destroyed) {
                        // Create explosion when enemy is destroyed by collision
                        this.game.effectsManager.createExplosion(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2,
                            enemy.width
                        );
                        
                        // Chance to drop power-up when enemy is destroyed by collision
                        if (Math.random() < 0.3) { // Higher chance from collision
                            this.game.powerUpManager.spawnAt(enemy.x + enemy.width / 2 - 10, enemy.y);
                        }
                    }
                    
                    // Add strong screen shake for player collision
                    this.game.addScreenShake(10, 15);
                }
            });
            
            // Boss collision
            if (boss) {
                if (this.checkRectangleCollision(player, boss)) {
                    // Player takes damage
                    player.hit();
                    
                    // Boss takes less damage from collisions
                    const playerSpeed = Math.hypot(player.velocityX, player.velocityY);
                    const collisionDamage = Math.floor(10 + playerSpeed * 2); // Less damage to boss
                    boss.hit(collisionDamage);
                    
                    // Create hit effect at the collision point
                    this.game.effectsManager.createHitEffect(
                        (player.x + player.width/2 + boss.x + boss.width/2) / 2,
                        (player.y + player.height/2 + boss.y + boss.height/2) / 2,
                        30,
                        '#FF3333' // Red effect for boss collision
                    );
                    
                    // Add strong screen shake for player collision
                    this.game.addScreenShake(10, 15);
                }
            }
        }
        
        // Check player against power-ups
        powerUps.forEach(powerUp => {
            if (this.checkRectangleCollision(player, powerUp)) {
                powerUp.applyEffect(player);
            }
        });
    }
    
    checkRectangleCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
} 