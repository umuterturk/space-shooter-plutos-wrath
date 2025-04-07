import { Projectile } from './Projectile.js';

export class Gun {
    constructor(game, player, type = 'basic') {
        this.game = game;
        this.player = player;
        this.type = type;
        this.projectiles = [];
        this.fireTimer = 0;
        
        // Bullet counting system
        this.bulletInventory = {
            basic: Infinity, // Basic gun has unlimited ammo
            double: 100,
            triple: 100,
            rapid: 100,
            plasma: 100
        };
        
        // Set properties based on gun type
        this.setGunProperties(type);
    }
    
    setGunProperties(type) {
        switch(type) {
            case 'double':
                this.fireRate = 1.4;
                this.projectileSpeed = 12;
                this.projectileDamage = 10;
                this.projectileColor = '#33CCFF';
                break;
            case 'triple':
                this.fireRate = 1.7;
                this.projectileSpeed = 12;
                this.projectileDamage = 10;
                this.projectileColor = '#33FF33';
                break;
            case 'rapid':
                this.fireRate = 1.0;
                this.projectileSpeed = 20;
                this.projectileDamage = 9;
                this.projectileColor = '#FFFF33';
                break;
            case 'plasma':
                this.fireRate = 5;
                this.projectileSpeed = 9;
                this.projectileDamage = 30;
                this.projectileColor = '#FF33FF';
                break;
            default: // basic
                this.fireRate = 1.2;
                this.projectileSpeed = 10;
                this.projectileDamage = 10;
                this.projectileColor = '#33CCFF';
        }
    }
    
    update() {
        // Increment fire timer
        this.fireTimer++;
        
        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            // Remove projectiles that go off screen
            if (projectile.y < -projectile.height || 
                projectile.x < -projectile.width || 
                projectile.x > this.game.width) {
                this.projectiles.splice(index, 1);
            }
        });
    }
    
    shoot() {
        // If we don't have bullets for the current gun type (and it's not basic), don't shoot
        if (this.type !== 'basic' && this.bulletInventory[this.type] <= 0) {
            // Show notification about no ammo
            this.game.notificationManager.addNotification(`NO ${this.type.toUpperCase()} AMMO`, '#FF3333', 60);
            // Switch back to basic gun
            this.player.setGun('basic');
            return false;
        }
        
        if (this.fireTimer >= this.fireRate) {
            // Get the ship's center position for projectile origin
            const shipCenterX = this.player.x + this.player.width / 2;
            const shipTopY = this.player.y;
            
            // Match spacecraft's velocity direction, not just roll effect
            // This ensures bullets travel in the same direction as the spacecraft
            const baseSpeedY = -(this.projectileSpeed + Math.abs(this.player.velocityY * 0.5));
            const baseSpeedX = 0;//this.player.velocityX * 0.7; // Inherit ship's horizontal momentum
            
            let shotFired = false;
            
            // Different shooting patterns based on gun type
            switch(this.type) {
                case 'double':
                    // Two parallel projectiles from wing tips
                    const leftProjectile = new Projectile(
                        this.game, 
                        shipCenterX - 12, 
                        shipTopY + 12,
                        0, // Speed is passed separately as vector components now
                        this.projectileDamage,
                        this.projectileColor
                    );
                    leftProjectile.xSpeed = baseSpeedX;
                    leftProjectile.ySpeed = baseSpeedY;
                    this.projectiles.push(leftProjectile);
                    
                    const rightProjectile = new Projectile(
                        this.game, 
                        shipCenterX + 12, 
                        shipTopY + 12,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    rightProjectile.xSpeed = baseSpeedX;
                    rightProjectile.ySpeed = baseSpeedY;
                    this.projectiles.push(rightProjectile);
                    shotFired = true;
                    break;
                case 'triple':
                    // Three projectiles: one straight, two at angles
                    const centerProjectile = new Projectile(
                        this.game, 
                        shipCenterX, 
                        shipTopY,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    centerProjectile.xSpeed = baseSpeedX;
                    centerProjectile.ySpeed = baseSpeedY;
                    this.projectiles.push(centerProjectile);
                    
                    const leftAngleProjectile = new Projectile(
                        this.game, 
                        shipCenterX - 8, 
                        shipTopY + 10,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    leftAngleProjectile.xSpeed = baseSpeedX - 2;
                    leftAngleProjectile.ySpeed = baseSpeedY * 0.9;
                    this.projectiles.push(leftAngleProjectile);
                    
                    const rightAngleProjectile = new Projectile(
                        this.game, 
                        shipCenterX + 8, 
                        shipTopY + 10,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    rightAngleProjectile.xSpeed = baseSpeedX + 2;
                    rightAngleProjectile.ySpeed = baseSpeedY * 0.9;
                    this.projectiles.push(rightAngleProjectile);
                    shotFired = true;
                    break;
                case 'rapid':
                    // Single, faster projectile with ship's momentum
                    const rapidProjectile = new Projectile(
                        this.game, 
                        shipCenterX, 
                        shipTopY,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    rapidProjectile.xSpeed = baseSpeedX;
                    rapidProjectile.ySpeed = baseSpeedY * 1.2; // Faster in direction of travel
                    this.projectiles.push(rapidProjectile);
                    shotFired = true;
                    break;
                case 'plasma':
                    // Larger, more powerful projectile
                    const plasma = new Projectile(
                        this.game, 
                        shipCenterX - 6, 
                        shipTopY + 5,
                        0,
                        this.projectileDamage,
                        this.projectileColor,
                        12, // width
                        16  // height
                    );
                    plasma.xSpeed = baseSpeedX;
                    plasma.ySpeed = baseSpeedY * 0.8; // Slower but more powerful
                    this.projectiles.push(plasma);
                    shotFired = true;
                    break;
                default: // basic
                    // Single projectile from nose
                    const basicProjectile = new Projectile(
                        this.game, 
                        shipCenterX - 2, 
                        shipTopY,
                        0,
                        this.projectileDamage,
                        this.projectileColor
                    );
                    basicProjectile.xSpeed = baseSpeedX;
                    basicProjectile.ySpeed = baseSpeedY;
                    this.projectiles.push(basicProjectile);
                    shotFired = true;
            }
            
            // If we fired a shot, decrement bullet count (if not basic)
            if (shotFired && this.type !== 'basic') {
                this.bulletInventory[this.type]--;
                
                // Show warning when bullets are low
                if (this.bulletInventory[this.type] === 50) {
                    this.game.notificationManager.addNotification(`${this.type.toUpperCase()} AMMO LOW`, '#FFAA00', 60);
                }
                // Switch to basic when out of ammo
                if (this.bulletInventory[this.type] <= 0) {
                    this.game.notificationManager.addNotification(`${this.type.toUpperCase()} DEPLETED`, '#FF3333', 60);
                    this.player.setGun('basic');
                }
            }
            
            this.fireTimer = 0;
            return true;
        }
        return false;
    }
    
    addBullets(type, amount) {
        if (this.bulletInventory.hasOwnProperty(type)) {
            this.bulletInventory[type] += amount;
            return true;
        }
        return false;
    }
    
    getBulletCount(type) {
        return this.bulletInventory[type] || 0;
    }
    
    draw(ctx) {
        // Draw all projectiles
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx);
        });
    }
} 