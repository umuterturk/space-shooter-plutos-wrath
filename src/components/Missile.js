export default class Missile {
    constructor(game, x, y, initialTarget) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 15;
        this.speed = 5;
        this.damage = 50; // High damage
        this.target = initialTarget;
        this.markedForDeletion = false;
        this.lifetime = 300; // Self-destructs after this many frames
        
        // Smoke trail effect
        this.smokeTrail = [];
        this.smokeInterval = 0;
        
        // Create missile sprite
        this.sprite = document.createElement('canvas');
        this.sprite.width = 20;
        this.sprite.height = 30;
        this.ctx = this.sprite.getContext('2d');
        this.createMissileSprite();
    }
    
    update() {
        // Decrease lifetime
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.explode();
            return;
        }
        
        // Create smoke particles at regular intervals
        this.smokeInterval++;
        if (this.smokeInterval >= 2) {
            this.smokeInterval = 0;
            this.createSmokeParticle();
        }
        
        // Update existing smoke particles
        for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
            const smoke = this.smokeTrail[i];
            smoke.opacity -= 0.03;
            smoke.size += 0.5;
            
            if (smoke.opacity <= 0) {
                this.smokeTrail.splice(i, 1);
            }
        }
        
        // Find a target if we don't have one
        if (!this.target || this.target.markedForDeletion) {
            this.findNewTarget();
        }
        
        // Calculate movement
        if (this.target) {
            // Home in on target
            const dx = this.target.x + this.target.width / 2 - this.x;
            const dy = this.target.y + this.target.height / 2 - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize and apply speed
                const speedX = (dx / distance) * this.speed;
                const speedY = (dy / distance) * this.speed;
                
                this.x += speedX;
                this.y += speedY;
            }
            
            // Check if we've hit the target
            if (this.checkCollision(this.target)) {
                this.explode();
                this.target.hit(this.damage);
            }
        } else {
            // No target, move forward
            this.y -= this.speed;
        }
        
        // Check if missile is off screen
        if (this.y < -50 || this.y > this.game.height + 50 || 
            this.x < -50 || this.x > this.game.width + 50) {
            this.markedForDeletion = true;
        }
    }
    
    findNewTarget() {
        // Find the closest enemy
        let closestEnemy = null;
        let closestDistance = Number.MAX_VALUE;
        
        // Check all enemies
        const enemies = this.game.enemyManager.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        // Check boss if exists
        if (this.game.enemyManager.boss) {
            const boss = this.game.enemyManager.boss;
            const dx = boss.x - this.x;
            const dy = boss.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = boss;
            }
        }
        
        // Only target if within reasonable range
        if (closestDistance < 500) {
            this.target = closestEnemy;
        } else {
            this.target = null;
        }
    }
    
    checkCollision(enemy) {
        return (
            this.x < enemy.x + enemy.width &&
            this.x + this.width > enemy.x &&
            this.y < enemy.y + enemy.height &&
            this.y + this.height > enemy.y
        );
    }
    
    explode() {
        // Create explosion effect
        this.game.effectsManager.createExplosion(
            this.x, 
            this.y, 
            30, // Size
            '#FF6600', // Orange
            8 // Particle count
        );
        
        // Apply damage to enemies in blast radius
        this.applyBlastDamage();
        
        // Add screen shake
        this.game.addScreenShake(5, 15);
        
        // Mark for deletion
        this.markedForDeletion = true;
    }
    
    applyBlastDamage() {
        const blastRadius = 80;
        const blastDamage = 25; // Splash damage
        
        // Check all enemies
        const enemies = this.game.enemyManager.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x + enemy.width / 2 - this.x;
            const dy = enemy.y + enemy.height / 2 - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < blastRadius) {
                // Apply damage based on distance from explosion
                const damageMultiplier = 1 - (distance / blastRadius);
                const damage = Math.floor(blastDamage * damageMultiplier);
                enemy.hit(damage);
                
                // Visual feedback for splash damage
                this.game.effectsManager.createHitEffect(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    15,
                    '#FF6600'
                );
            }
        }
        
        // Check boss
        if (this.game.enemyManager.boss) {
            const boss = this.game.enemyManager.boss;
            const dx = boss.x + boss.width / 2 - this.x;
            const dy = boss.y + boss.height / 2 - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < blastRadius) {
                // Apply damage based on distance from explosion
                const damageMultiplier = 1 - (distance / blastRadius);
                const damage = Math.floor(blastDamage * damageMultiplier);
                boss.hit(damage);
                
                // Visual feedback for splash damage
                this.game.effectsManager.createHitEffect(
                    boss.x + boss.width / 2,
                    boss.y + boss.height / 2,
                    20,
                    '#FF6600'
                );
            }
        }
    }
    
    createSmokeParticle() {
        this.smokeTrail.push({
            x: this.x,
            y: this.y + this.height / 2,
            size: 3,
            opacity: 0.7
        });
    }
    
    createMissileSprite() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.sprite.width, this.sprite.height);
        
        // Missile body
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(
            this.sprite.width / 2 - 3,
            5,
            6,
            15
        );
        
        // Missile head
        ctx.beginPath();
        ctx.moveTo(this.sprite.width / 2 - 3, 5);
        ctx.lineTo(this.sprite.width / 2, 0);
        ctx.lineTo(this.sprite.width / 2 + 3, 5);
        ctx.fillStyle = '#FF3300';
        ctx.fill();
        
        // Fins
        ctx.beginPath();
        ctx.moveTo(this.sprite.width / 2 - 3, 20);
        ctx.lineTo(this.sprite.width / 2 - 6, 25);
        ctx.lineTo(this.sprite.width / 2 - 3, 15);
        ctx.fillStyle = '#FF6600';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.sprite.width / 2 + 3, 20);
        ctx.lineTo(this.sprite.width / 2 + 6, 25);
        ctx.lineTo(this.sprite.width / 2 + 3, 15);
        ctx.fillStyle = '#FF6600';
        ctx.fill();
        
        // Thruster flame (animated in draw)
    }
    
    draw(ctx) {
        // Draw smoke trail
        for (const smoke of this.smokeTrail) {
            ctx.globalAlpha = smoke.opacity;
            ctx.fillStyle = '#BBBBBB';
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1;
        
        // Draw missile
        ctx.save();
        
        // Translate to missile position and rotate toward target
        ctx.translate(this.x, this.y);
        
        let angle = -Math.PI / 2; // Default straight up
        
        if (this.target) {
            // Calculate angle to target
            const dx = this.target.x + this.target.width / 2 - this.x;
            const dy = this.target.y + this.target.height / 2 - this.y;
            angle = Math.atan2(dy, dx);
        }
        
        ctx.rotate(angle + Math.PI / 2);
        
        // Draw missile sprite
        ctx.drawImage(
            this.sprite,
            -this.sprite.width / 2,
            -this.sprite.height / 2
        );
        
        // Draw flame (animated)
        ctx.beginPath();
        const flameHeight = 5 + Math.random() * 5;
        ctx.moveTo(-3, 20);
        ctx.lineTo(0, 20 + flameHeight);
        ctx.lineTo(3, 20);
        ctx.fillStyle = Math.random() > 0.5 ? '#FFCC00' : '#FF6600';
        ctx.fill();
        
        ctx.restore();
    }
} 