import { Enemy } from './Enemy.js';

export class Boss {
    constructor(game, x, y, level) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.level = level || 1; // Boss level (defaults to 1)
        this.markedForDeletion = false;
        
        // Boss size and stats (scales with level)
        this.width = 150;
        this.height = this.width * 0.8;
        this.baseSpeed = 2.5; // Increased base speed
        this.speed = this.baseSpeed * (1 + this.level * 0.15); // Higher scaling
        this.health = 600 * (1 + this.level * 0.6); // Increased health
        this.maxHealth = this.health;
        this.score = 800 * this.level; // Higher score reward
        
        // Visual effects
        this.isFlashing = false;
        this.flashDuration = 8;
        this.flashTimer = 0;
        
        // Movement properties
        this.movementPhase = 'entering'; // entering, attack, retreat
        this.phaseTimer = 0;
        this.attackPattern = 0; // Current attack pattern
        this.attackDuration = 300; // Duration of each attack phase
        this.attackCooldown = 120; // Cooldown between attacks
        this.cooldownTimer = 0;
        
        // Position targets
        this.targetY = 100; // Target Y position after entering
        this.entrySpeed = this.speed * 1.5;
        
        // Wave movement parameters
        this.initialX = x;
        this.waveAmplitude = this.game.width / 3; // Wider movement range
        this.waveFrequency = 0.007 * (1 + this.level * 0.12); // Faster movement with level
        
        // Weapon properties
        this.fireTimer = 0;
        this.fireRate = Math.max(25 - (this.level * 3), 8); // Faster firing at higher levels
        this.projectiles = [];
        this.projectileSpeed = 6 + (this.level); // Faster projectiles
        this.projectileDamage = 20;
        
        // Minion spawning
        this.canSpawnMinions = this.level >= 1; // Any boss can spawn minions
        this.minionSpawnTimer = 0;
        this.minionSpawnRate = Math.max(300 - (this.level * 30), 120); // Spawn rate based on level
        
        // Create boss sprite
        this.sprite = this.createBossSprite();
        
        // Shield effect
        this.shieldActive = this.level >= 2; // Shield for higher level bosses
        this.shieldHealth = 250 * this.level;
        this.maxShieldHealth = this.shieldHealth;
        this.shieldRechargeRate = 0.25 * this.level;
        this.shieldBroken = false;
        this.shieldRechargeDelay = 300; // Time before shield starts recharging
        this.shieldRechargeTimer = 0;
        
        // Special attack indicators
        this.chargingSpecial = false;
        this.chargeAmount = 0;
        this.maxChargeAmount = 100;
        
        // Special attack effects
        this.specialAttackReady = false;
        this.specialAttackCooldown = 500; // Shorter cooldown for special attacks
        this.specialAttackTimer = this.specialAttackCooldown / 2; // Start halfway charged
    }
    
    createBossSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Base color based on level
        const colors = [
            '#FF2200', // Level 1 - Red
            '#880088', // Level 2 - Purple
            '#0088FF', // Level 3 - Blue
            '#008800', // Level 4 - Green
            '#FF8800'  // Level 5+ - Orange
        ];
        
        const bossColor = colors[Math.min(this.level - 1, colors.length - 1)];
        
        // Draw main hull (based on level)
        ctx.fillStyle = bossColor;
        
        // Main body shape
        ctx.beginPath();
        ctx.moveTo(this.width * 0.5, 0); // Top center
        ctx.lineTo(this.width * 0.8, this.height * 0.2); // Top right
        ctx.lineTo(this.width, this.height * 0.5); // Middle right
        ctx.lineTo(this.width * 0.8, this.height * 0.8); // Bottom right
        ctx.lineTo(this.width * 0.2, this.height * 0.8); // Bottom left
        ctx.lineTo(0, this.height * 0.5); // Middle left
        ctx.lineTo(this.width * 0.2, this.height * 0.2); // Top left
        ctx.closePath();
        ctx.fill();
        
        // Add details based on level
        const detailColor = '#FFCC00';
        ctx.fillStyle = detailColor;
        
        // Draw engines
        ctx.beginPath();
        ctx.roundRect(this.width * 0.3, this.height * 0.8, this.width * 0.1, this.height * 0.1, 5);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(this.width * 0.6, this.height * 0.8, this.width * 0.1, this.height * 0.1, 5);
        ctx.fill();
        
        // Draw center section
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(this.width * 0.5, this.height * 0.4, this.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy core
        ctx.fillStyle = detailColor;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, this.height * 0.4, this.width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Add weapons based on level
        for (let i = 0; i < Math.min(this.level + 1, 5); i++) {
            const xPos = this.width * (0.3 + (i * 0.1));
            ctx.fillStyle = '#666666';
            ctx.fillRect(xPos - 5, this.height * 0.7, 10, 10);
        }
        
        // Add level indicator
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`L${this.level}`, this.width * 0.5, this.height * 0.45);
        
        return canvas;
    }
    
    update() {
        // Handle movement phases
        switch (this.movementPhase) {
            case 'entering':
                // Move down to target position
                this.y += this.entrySpeed;
                if (this.y >= this.targetY) {
                    this.y = this.targetY;
                    this.movementPhase = 'attack';
                    this.phaseTimer = 0;
                    this.attackPattern = Math.floor(Math.random() * 3);
                }
                break;
                
            case 'attack':
                this.phaseTimer++;
                
                // Execute current attack pattern
                switch (this.attackPattern) {
                    case 0: // Wave pattern
                        this.x = this.initialX + Math.sin(this.phaseTimer * this.waveFrequency) * this.waveAmplitude;
                        break;
                        
                    case 1: // Figure-8 pattern
                        const t = this.phaseTimer * this.waveFrequency;
                        this.x = this.initialX + Math.sin(t * 2) * this.waveAmplitude * 0.7;
                        this.y = this.targetY + Math.sin(t) * 50;
                        break;
                        
                    case 2: // Chase player
                        const playerX = this.game.player.x + this.game.player.width / 2;
                        const bossX = this.x + this.width / 2;
                        
                        if (Math.abs(playerX - bossX) > this.speed * 2) {
                            if (bossX < playerX) {
                                this.x += this.speed * 0.5;
                            } else {
                                this.x -= this.speed * 0.5;
                            }
                        }
                        
                        // Small vertical movement
                        this.y = this.targetY + Math.sin(this.phaseTimer * 0.02) * 30;
                        break;
                }
                
                // Keep within bounds
                if (this.x < 0) this.x = 0;
                if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
                
                // Change attack pattern periodically
                if (this.phaseTimer >= this.attackDuration) {
                    this.movementPhase = 'cooldown';
                    this.cooldownTimer = 0;
                }
                break;
                
            case 'cooldown':
                // Small movements during cooldown
                this.x = this.initialX + Math.sin(this.cooldownTimer * 0.01) * 20;
                
                this.cooldownTimer++;
                if (this.cooldownTimer >= this.attackCooldown) {
                    this.movementPhase = 'attack';
                    this.phaseTimer = 0;
                    this.attackPattern = (this.attackPattern + 1) % 3;
                    this.initialX = this.x;
                }
                break;
        }
        
        // Weapon firing
        this.fireTimer++;
        if (this.fireTimer >= this.fireRate && this.movementPhase === 'attack') {
            this.fireProjectiles();
            this.fireTimer = 0;
        }
        
        // Minion spawning
        if (this.canSpawnMinions && this.movementPhase === 'attack') {
            this.minionSpawnTimer++;
            if (this.minionSpawnTimer >= this.minionSpawnRate) {
                this.spawnMinions();
                this.minionSpawnTimer = 0;
            }
        }
        
        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.x += projectile.speedX;
            projectile.y += projectile.speedY;
            
            // Remove off-screen projectiles
            if (projectile.y > this.game.height || 
                projectile.x < 0 || 
                projectile.x > this.game.width) {
                this.projectiles.splice(index, 1);
            }
            
            // Check for collisions with player
            if (!this.game.player.invulnerable) {
                const dx = projectile.x - (this.game.player.x + this.game.player.width / 2);
                const dy = projectile.y - (this.game.player.y + this.game.player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < (this.game.player.width / 2 + projectile.size / 2)) {
                    // Hit player
                    this.game.player.hit();
                    this.projectiles.splice(index, 1);
                    
                    // Create hit effect
                    this.game.effectsManager.createHitEffect(
                        this.game.player.x + this.game.player.width / 2,
                        this.game.player.y + this.game.player.height / 2
                    );
                }
            }
        });
        
        // Special attack charge
        this.specialAttackTimer++;
        if (this.specialAttackTimer >= this.specialAttackCooldown) {
            this.specialAttackReady = true;
            
            // If ready and below 50% health, use special attack
            if (this.health < this.maxHealth * 0.5 && !this.chargingSpecial) {
                this.initiateSpecialAttack();
            }
        }
        
        // Special attack charging
        if (this.chargingSpecial) {
            this.chargeAmount += 2;
            
            // Create charging particles
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 50 + 30;
                this.game.effectsManager.createHitEffect(
                    this.x + this.width / 2 + Math.cos(angle) * distance,
                    this.y + this.height / 2 + Math.sin(angle) * distance,
                    Math.random() * 10 + 5
                );
            }
            
            if (this.chargeAmount >= this.maxChargeAmount) {
                this.fireSpecialAttack();
            }
        }
        
        // Update shield
        if (this.shieldActive && !this.shieldBroken) {
            // Shield regeneration logic removed for simplicity
        } else if (this.shieldBroken) {
            this.shieldRechargeTimer++;
            if (this.shieldRechargeTimer >= this.shieldRechargeDelay) {
                this.shieldBroken = false;
                this.shieldHealth = this.maxShieldHealth * 0.3; // Recharge to 30%
            }
        }
        
        // Update flash effect
        if (this.isFlashing) {
            this.flashTimer--;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
            }
        }
    }
    
    draw(ctx) {
        // Draw shield if active
        if (this.shieldActive && !this.shieldBroken && this.shieldHealth > 0) {
            ctx.save();
            const shieldGradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, this.width / 2,
                this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8
            );
            
            const shieldColor = this.level >= 3 ? '#00FFFF' : '#4488FF';
            shieldGradient.addColorStop(0, 'rgba(68, 136, 255, 0)');
            shieldGradient.addColorStop(0.7, 'rgba(68, 136, 255, 0.1)');
            shieldGradient.addColorStop(0.9, `${shieldColor}66`);
            shieldGradient.addColorStop(1, `${shieldColor}00`);
            
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * 0.8,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Shield border
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw charging effect
        if (this.chargingSpecial) {
            ctx.save();
            const chargeRatio = this.chargeAmount / this.maxChargeAmount;
            
            // Charging glow
            const chargeGradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 10,
                this.x + this.width / 2, this.y + this.height / 2, this.width * chargeRatio
            );
            
            chargeGradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
            chargeGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.4)');
            chargeGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = chargeGradient;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * chargeRatio,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
        
        // Apply flash effect when hit
        if (this.isFlashing) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
        // Draw boss sprite
        ctx.drawImage(this.sprite, this.x, this.y);
        
        // Draw projectiles
        this.projectiles.forEach(projectile => {
            ctx.save();
            
            // Projectile color based on level
            let color = '#FF3300';
            if (this.level === 2) color = '#FF00FF';
            if (this.level === 3) color = '#00FFFF';
            if (this.level >= 4) color = '#FFFF00';
            
            const gradient = ctx.createRadialGradient(
                projectile.x, projectile.y, 0,
                projectile.x, projectile.y, projectile.size
            );
            
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw health bar
        const healthBarWidth = this.width;
        const healthBarHeight = 8;
        const healthBarX = this.x;
        const healthBarY = this.y - 15;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health amount
        const healthRatio = this.health / this.maxHealth;
        ctx.fillStyle = this.getHealthColor(healthRatio);
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
        
        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Draw shield bar if active
        if (this.shieldActive) {
            const shieldBarY = healthBarY - 10;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(healthBarX, shieldBarY, healthBarWidth, healthBarHeight);
            
            // Shield amount
            if (!this.shieldBroken) {
                const shieldRatio = this.shieldHealth / this.maxShieldHealth;
                ctx.fillStyle = '#4488FF';
                ctx.fillRect(healthBarX, shieldBarY, healthBarWidth * shieldRatio, healthBarHeight);
            }
            
            // Border
            ctx.strokeStyle = '#88CCFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(healthBarX, shieldBarY, healthBarWidth, healthBarHeight);
        }
    }
    
    getHealthColor(ratio) {
        if (ratio > 0.6) return '#33FF33';
        if (ratio > 0.3) return '#FFCC00';
        return '#FF3333';
    }
    
    fireProjectiles() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        
        // Different firing patterns based on level
        switch (this.level) {
            case 1: // Triple shot for level 1 (increased from single)
                this.addProjectile(centerX, centerY, 0, this.projectileSpeed);
                this.addProjectile(centerX - 20, centerY, -0.8, this.projectileSpeed);
                this.addProjectile(centerX + 20, centerY, 0.8, this.projectileSpeed);
                break;
                
            case 2: // Five shot for level 2 (increased from triple)
                this.addProjectile(centerX, centerY, 0, this.projectileSpeed);
                this.addProjectile(centerX - 15, centerY, -0.5, this.projectileSpeed);
                this.addProjectile(centerX + 15, centerY, 0.5, this.projectileSpeed);
                this.addProjectile(centerX - 30, centerY, -1, this.projectileSpeed);
                this.addProjectile(centerX + 30, centerY, 1, this.projectileSpeed);
                break;
                
            case 3: // Spread pattern for level 3
                for (let i = -3; i <= 3; i++) {
                    this.addProjectile(centerX + (i * 12), centerY, i * 0.4, this.projectileSpeed);
                }
                break;
                
            default: // 360 spray for level 4+
                const angleStep = Math.PI / 8;
                for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                    const speedX = Math.sin(angle) * this.projectileSpeed * 0.8;
                    const speedY = Math.cos(angle) * this.projectileSpeed * 0.8;
                    this.addProjectile(centerX, centerY, speedX, speedY);
                }
                break;
        }
    }
    
    addProjectile(x, y, speedX, speedY) {
        this.projectiles.push({
            x: x,
            y: y,
            speedX: speedX,
            speedY: speedY,
            size: 6 + this.level
        });
    }
    
    initiateSpecialAttack() {
        // Start charging special attack
        this.chargingSpecial = true;
        this.chargeAmount = 0;
        this.specialAttackReady = false;
        this.specialAttackTimer = 0;
        
        // Slow down movement during charging
        this.speed = this.baseSpeed * 0.3;
        
        // Notification
        this.game.notificationManager.addNotification('BOSS CHARGING ATTACK!', '#FF0000', 120);
        
        // Add screen shake
        this.game.addScreenShake(3, 30);
    }
    
    fireSpecialAttack() {
        // Reset charging state
        this.chargingSpecial = false;
        this.chargeAmount = 0;
        this.speed = this.baseSpeed * (1 + this.level * 0.1);
        
        // Determine attack type based on level
        if (this.level <= 2) {
            // Level 1-2: Radial blast
            this.fireRadialBlast();
        } else {
            // Level 3+: Laser beam
            this.fireLaserAttack();
        }
        
        // Add intense screen shake
        this.game.addScreenShake(10, 30);
    }
    
    fireRadialBlast() {
        // Fire projectiles in all directions (increased count)
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        const projectileCount = 24 + (this.level * 4); // Increased from 16
        
        for (let i = 0; i < projectileCount; i++) {
            const angle = (Math.PI * 2 / projectileCount) * i;
            const speedX = Math.cos(angle) * this.projectileSpeed * 1.5;
            const speedY = Math.sin(angle) * this.projectileSpeed * 1.5;
            
            this.projectiles.push({
                x: centerX,
                y: centerY,
                speedX: speedX,
                speedY: speedY,
                size: 8 + this.level
            });
        }
        
        // Add explosion effect
        this.game.effectsManager.createExplosion(centerX, centerY, 100); // Bigger explosion
        this.game.notificationManager.addNotification('RADIAL BLAST!', '#FF0000', 60);
        
        // Add minions during special attack for higher level bosses
        if (this.level >= 2) {
            setTimeout(() => this.spawnMinions(), 300);
        }
    }
    
    fireLaserAttack() {
        // Create a large explosion aimed at player
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        
        // Target player position
        const playerX = this.game.player.x + this.game.player.width / 2;
        const playerY = this.game.player.y + this.game.player.height / 2;
        
        // Direction vector
        const dx = playerX - centerX;
        const dy = playerY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalized direction
        const normX = dx / distance;
        const normY = dy / distance;
        
        // Create laser beam effect (series of explosions along path)
        const segments = 8;
        for (let i = 1; i <= segments; i++) {
            const segmentX = centerX + normX * (distance / segments) * i;
            const segmentY = centerY + normY * (distance / segments) * i;
            
            // Staggered explosions
            setTimeout(() => {
                this.game.effectsManager.createExplosion(segmentX, segmentY, 30);
                
                // On final segment, check player hit
                if (i === segments) {
                    // Check if player is hit
                    const hitDx = segmentX - playerX;
                    const hitDy = segmentY - playerY;
                    const hitDistance = Math.sqrt(hitDx * hitDx + hitDy * hitDy);
                    
                    if (hitDistance < 50 && !this.game.player.invulnerable) {
                        this.game.player.hit();
                        this.game.effectsManager.createExplosion(playerX, playerY, 40);
                    }
                }
            }, i * 100);
        }
        
        this.game.notificationManager.addNotification('LASER BEAM!', '#FF0000', 60);
    }
    
    hit(damage) {
        // Check if shield takes the hit
        if (this.shieldActive && !this.shieldBroken && this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            
            // Shield break
            if (this.shieldHealth <= 0) {
                this.shieldBroken = true;
                this.shieldRechargeTimer = 0;
                this.game.notificationManager.addNotification('SHIELD BROKEN!', '#00FFFF', 60);
                
                // Create shield break effect
                this.game.effectsManager.createExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.width * 0.8
                );
                
                this.game.addScreenShake(5, 15);
            }
            
            return false;
        }
        
        // Boss takes damage
        this.health -= damage;
        
        // Trigger flash effect
        this.isFlashing = true;
        this.flashTimer = this.flashDuration;
        
        // Add hit particles
        this.game.effectsManager.createHitEffect(
            this.x + this.width / 2 + (Math.random() - 0.5) * 40,
            this.y + this.height / 2 + (Math.random() - 0.5) * 40,
            Math.random() * 10 + 5
        );
        
        // Check for damage milestones
        if (this.health <= this.maxHealth * 0.7 && this.health > this.maxHealth * 0.65) {
            this.game.notificationManager.addNotification('BOSS DAMAGED!', '#FFCC00', 60);
        } else if (this.health <= this.maxHealth * 0.5 && this.health > this.maxHealth * 0.45) {
            this.game.notificationManager.addNotification('BOSS ENRAGED!', '#FF6600', 60);
            
            // Increase speed
            this.speed *= 1.3;
            this.fireRate = Math.max(this.fireRate * 0.7, 8);
        } else if (this.health <= this.maxHealth * 0.25 && this.health > this.maxHealth * 0.2) {
            this.game.notificationManager.addNotification('BOSS CRITICAL!', '#FF0000', 60);
            
            // Further increase speed
            this.speed *= 1.2;
            this.fireRate = Math.max(this.fireRate * 0.8, 5);
        }
        
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true;
        }
        
        return false;
    }
    
    // Add minion spawning method
    spawnMinions() {
        // Determine how many minions to spawn based on level
        const minionCount = Math.min(1 + Math.floor(this.level / 2), 4);
        
        for (let i = 0; i < minionCount; i++) {
            // Calculate spawn position (around the boss)
            const offsetX = (Math.random() - 0.5) * this.width;
            const offsetY = this.height * 0.8;
            const spawnX = this.x + this.width/2 + offsetX;
            const spawnY = this.y + offsetY;
            
            // Determine minion type (higher chance of better minions with higher boss level)
            let minionType = 'small';
            const typeRoll = Math.random();
            
            if (this.level >= 3) {
                if (typeRoll < 0.2) minionType = 'large';
                else if (typeRoll < 0.6) minionType = 'medium';
            } else if (this.level >= 2) {
                if (typeRoll < 0.5) minionType = 'medium';
            }
            
            // Scale based on boss level
            const minionScale = {
                healthMultiplier: 1 + (this.level * 0.1),
                speedMultiplier: 1 + (this.level * 0.05),
                scoreMultiplier: 1
            };
            
            // Spawn the minion
            const minion = new Enemy(this.game, spawnX, spawnY, minionType, minionScale);
            this.game.enemyManager.enemies.push(minion);
            
            // Add spawn effect
            this.game.effectsManager.createHitEffect(spawnX, spawnY, 15);
        }
        
        // Add notification for first spawn in a battle
        if (this.health === this.maxHealth) {
            this.game.notificationManager.addNotification('BOSS SUMMONS MINIONS!', '#FF6600', 90);
        }
    }
} 