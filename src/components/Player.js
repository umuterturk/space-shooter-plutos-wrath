import { Gun } from './Gun.js';
import Missile from './Missile.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.width = 36;
        this.height = 48;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 20;
        
        // Physics properties for momentum-based movement
        this.baseSpeed = 0; // Always moving forward at this speed
        this.maxSpeed = 8; // Increased max speed
        this.acceleration = 0.4; // Increased acceleration
        this.deceleration = 0.08; // Increased deceleration
        this.velocityX = 0;
        this.velocityY = -this.baseSpeed; // Start moving forward (up)
        
        this.health = 100;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 60; // frames of invulnerability after hit
        
        // God mode properties
        this.godModeActive = false;
        this.godModeParticles = [];
        
        // Gun system
        this.gun = new Gun(game, this, 'basic');
        this.gunType = 'basic';
        
        // Gun types mapping to numbers
        this.gunTypes = {
            '1': 'basic',
            '2': 'double',
            '3': 'triple',
            '4': 'rapid',
            '5': 'plasma'
        };
        
        // Thruster animation
        this.thrusterActive = true; // Always active
        this.thrusterFrame = 0;
        this.thrusterFrameCount = 4;
        this.thrusterFrameDelay = 6;
        this.thrusterTimer = 0;
        
        // Ship roll rotation (no yaw/pitch)
        this.rollAngle = 0;
        this.targetRollAngle = 0;
        this.rollSpeed = 0.15; // Faster rotation
        
        // Load spacecraft image
        this.sprite = new Image();
        this.sprite.src = 'src/assets/images/spacecraft.png';
        this.sprite.onerror = () => {
            console.error('Error loading spacecraft image, using fallback');
            // Create a fallback sprite if image fails to load
            this.sprite = this.createFallbackSprite();
        };
        this.thrusterSprites = this.createThrusterSprites();
        
        // Power-up timers
        this.powerUpDuration = 600; // 10 seconds at 60fps
        
        this.agilityActive = false;
        this.agilityTimer = 0;
        
        this.thrustActive = false;
        this.thrustTimer = 0;
        
        // Nuclear weapon capability
        this.nuclearWeapons = 0;
        this.maxNuclearWeapons = 3;
        this.nuclearCooldown = 0;
        this.nuclearCooldownTime = 30; // Half second cooldown
        
        // Missile launcher capability
        this.missiles = [];
        this.missileCount = 0;
        this.maxMissiles = 20;
        this.missileCooldown = 0;
        this.missileCooldownTime = 60; // 1 second at 60fps
        this.missilesPerLaunch = 5;
    }

    createThrusterSprites() {
        const sprites = [];
        const colors = ['#FF6600', '#FFAA00', '#FFFF00', '#FFFFFF'];
        
        for (let i = 0; i < this.thrusterFrameCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = 12; // Height of the thrusters
            const ctx = canvas.getContext('2d');
            
            // Left thruster
            const leftLength = 6 + Math.random() * 6; // Longer flame length
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(this.width * 0.42, 0);
            ctx.lineTo(this.width * 0.38, leftLength);
            ctx.lineTo(this.width * 0.42, leftLength * 0.8);
            ctx.lineTo(this.width * 0.46, leftLength);
            ctx.closePath();
            ctx.fill();
            
            // Right thruster
            const rightLength = 6 + Math.random() * 6;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(this.width * 0.58, 0);
            ctx.lineTo(this.width * 0.54, rightLength);
            ctx.lineTo(this.width * 0.58, rightLength * 0.8);
            ctx.lineTo(this.width * 0.62, rightLength);
            ctx.closePath();
            ctx.fill();
            
            sprites.push(canvas);
        }
        
        return sprites;
    }

    update(deltaTime) {
        // Apply acceleration based on input
        if (this.game.inputHandler.keys.includes('ArrowLeft')) {
            this.velocityX -= this.acceleration;
            this.targetRollAngle = -0.3; // Roll left
            this.thrusterActive = true;
        } 
        if (this.game.inputHandler.keys.includes('ArrowRight')) {
            this.velocityX += this.acceleration;
            this.targetRollAngle = 0.3; // Roll right
            this.thrusterActive = true;
        }
        
        // Forward/backward adjustment (modifies base speed)
        if (this.game.inputHandler.keys.includes('ArrowUp')) {
            this.velocityY -= this.acceleration;
            this.thrusterActive = true;
        }
        if (this.game.inputHandler.keys.includes('ArrowDown')) {
            this.velocityY += this.acceleration;
            this.thrusterActive = true;
        }
        
        // If no horizontal input, animate back to center rotation
        if (!this.game.inputHandler.keys.includes('ArrowLeft') && 
            !this.game.inputHandler.keys.includes('ArrowRight')) {
            this.targetRollAngle = 0;
        }
        
        // Smooth rotation animation - ROLL ONLY, no yaw
        this.rollAngle += (this.targetRollAngle - this.rollAngle) * this.rollSpeed;
        
        // Apply deceleration (drag)
        if (!this.game.inputHandler.keys.includes('ArrowLeft') && 
            !this.game.inputHandler.keys.includes('ArrowRight')) {
            this.velocityX *= (1 - this.deceleration);
        }
        
        // Maintain minimum forward speed
        if (!this.game.inputHandler.keys.includes('ArrowUp') && 
            !this.game.inputHandler.keys.includes('ArrowDown')) {
            // Return to base speed gradually
            this.velocityY += ((-this.baseSpeed) - this.velocityY) * this.deceleration;
        }
        
        // Limit max speed
        this.velocityX = Math.max(Math.min(this.velocityX, this.maxSpeed), -this.maxSpeed);
        this.velocityY = Math.max(Math.min(this.velocityY, this.maxSpeed), -this.maxSpeed * 1.5);
        
        // Apply velocity to position (add forward vector even when rolling)
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Keep ship within game boundaries with some bounce effect
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = -this.velocityX * 0.5; // Bounce with reduced velocity
        }
        if (this.x > this.game.width - this.width) {
            this.x = this.game.width - this.width;
            this.velocityX = -this.velocityX * 0.5;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = -this.velocityY * 0.5;
        }
        if (this.y > this.game.height - this.height) {
            this.y = this.game.height - this.height;
            this.velocityY = -this.velocityY * 0.5;
        }

        // Shooting
        if (this.game.inputHandler.keys.includes(' ') || this.game.inputHandler.keys.includes('Control')) {
            this.shoot();
        }

        // Handle god mode particles
        if (this.godModeActive) {
            // Add god mode particles
            if (Math.random() < 0.3) {
                this.godModeParticles.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    size: Math.random() * 4 + 2,
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: (Math.random() - 0.5) * 2,
                    color: Math.random() < 0.5 ? '#FFFFFF' : '#FFDD00',
                    alpha: 1
                });
            }
            
            // Update god mode particles
            this.godModeParticles.forEach((particle, index) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.size *= 0.95;
                particle.alpha *= 0.95;
                
                if (particle.alpha < 0.1 || particle.size < 0.5) {
                    this.godModeParticles.splice(index, 1);
                }
            });
        }
        
        // Update thrusters animation
        this.thrusterTimer++;
        if (this.thrusterTimer > this.thrusterFrameDelay) {
            this.thrusterFrame = (this.thrusterFrame + 1) % this.thrusterFrameCount;
            this.thrusterTimer = 0;
        }
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer++;
            if (this.invulnerableTimer >= this.invulnerableDuration) {
                this.invulnerable = false;
                this.godModeActive = false;
                this.invulnerableTimer = 0;
            }
        }
        
        // Update gun
        this.gun.update();
        
        // Check for gun switching with number keys (1-5)
        for (const key in this.gunTypes) {
            if (this.game.inputHandler.keys.includes(key)) {
                const gunType = this.gunTypes[key];
                // Only switch if it's a different gun and we have ammo for it (or it's basic)
                if (this.gunType !== gunType && 
                    (gunType === 'basic' || this.gun.getBulletCount(gunType) > 0)) {
                    this.setGun(gunType);
                    this.game.notificationManager.addNotification(
                        `SWITCHED TO ${gunType.toUpperCase()}`,
                        this.gun.projectileColor,
                        60
                    );
                } else if (this.gunType !== gunType && gunType !== 'basic') {
                    // Notify player they have no ammo for this gun
                    this.game.notificationManager.addNotification(
                        `NO ${gunType.toUpperCase()} AMMO`,
                        '#FF3333',
                        60
                    );
                }
            }
        }
        
        // Update power-up timers
        if (this.agilityActive) {
            this.agilityTimer++;
            if (this.agilityTimer >= this.powerUpDuration) {
                // Reset agility enhancements
                this.agilityActive = false;
                this.rollSpeed = 0.15; // Reset to default
                this.deceleration = 0.08; // Reset to default
            }
        }
        
        if (this.thrustActive) {
            this.thrustTimer++;
            if (this.thrustTimer >= this.powerUpDuration) {
                // Reset thrust enhancements
                this.thrustActive = false;
                this.acceleration = 0.4; // Reset to default
                this.maxSpeed = 8; // Reset to default
            }
        }
        
        // GodMode is handled by the existing invulnerability timer
        if (this.godModeActive && this.invulnerableTimer >= this.invulnerableDuration) {
            this.godModeActive = false;
        }
        
        // Update nuclear weapon cooldown
        if (this.nuclearCooldown > 0) {
            this.nuclearCooldown--;
        }
        
        // Check for nuclear weapon activation
        if (this.game.inputHandler.keys.includes('e') && this.nuclearWeapons > 0 && this.nuclearCooldown === 0) {
            this.activateNuclearWeapon();
        }
        
        // Update missile cooldown
        if (this.missileCooldown > 0) {
            this.missileCooldown--;
        }
        
        // Check for Q key to launch missiles
        if (this.game.inputHandler.keys.includes('q') || this.game.inputHandler.keys.includes('Q')) {
            this.launchMissiles();
        }
        
        // Update missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            this.missiles[i].update();
            
            // Remove missiles that are marked for deletion
            if (this.missiles[i].markedForDeletion) {
                this.missiles.splice(i, 1);
            }
        }
    }

    shoot() {
        this.gun.shoot();
    }
    
    setGun(type) {
        const oldGun = this.gun;
        // Save the projectiles from the old gun
        const oldProjectiles = oldGun ? [...oldGun.projectiles] : [];
        
        this.gun = new Gun(this.game, this, type);
        this.gunType = type;
        
        // Copy over the bullet inventory from the old gun
        if (oldGun) {
            for (const gunType in oldGun.bulletInventory) {
                this.gun.bulletInventory[gunType] = oldGun.bulletInventory[gunType];
            }
            
            // Copy over the existing projectiles to keep them on screen
            this.gun.projectiles = oldProjectiles;
        }
    }

    draw(ctx) {
        // Draw god mode shield effect
        if (this.godModeActive) {
            ctx.save();
            
            // Draw shield glow
            const shieldGradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 10,
                this.x + this.width / 2, this.y + this.height / 2, 40
            );
            
            shieldGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            shieldGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
            shieldGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw god mode particles
            this.godModeParticles.forEach(particle => {
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            });
            
            ctx.restore();
        }
        
        // Draw invulnerability effect (blinking)
        if (this.invulnerable && !this.godModeActive && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Save context for rotation
        ctx.save();
        
        // Translate to center of player for rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // disable roll rotation (z-axis only)
        // ctx.rotate(this.rollAngle);
        
        // Draw ship (adjusted for rotation origin)
        const scaleFactor = 1.0; // 50% of original size
        const scaledWidth = this.width * scaleFactor;
        const scaledHeight = this.height * scaleFactor;
        // Center the scaled image properly
        ctx.drawImage(
            this.sprite,
            -scaledWidth / 2,   // Center horizontally
            -scaledHeight / 2,  // Center vertically
            scaledWidth,        // 50% of original width
            scaledHeight        // 50% of original height
        );
        
        // Draw thruster if active
        // if (this.thrusterActive) {
        //     ctx.drawImage(
        //         this.thrusterSprites[this.thrusterFrame],
        //         -this.width / 2,
        //         this.height / 2 - 2 // Position just below ship
        //     );
        // }
        
        // Restore context
        ctx.restore();
        ctx.globalAlpha = 1; // Reset alpha
        
        // Draw edge indicators when player is near screen bounds
        this.drawEdgeIndicators(ctx);
        
        // Draw weapon projectiles
        this.gun.draw(ctx);
        
        // Draw bullet counts for guns
        this.drawBulletCounts(ctx);
        
        // Draw missiles
        this.missiles.forEach(missile => {
            missile.draw(ctx);
        });
    }

    // New method to draw visual indicators when player is near screen edges
    drawEdgeIndicators(ctx) {
        const edgeThreshold = 100; // Distance from edge to start showing indicator
        const indicatorSize = 30;
        
        ctx.save();
        
        // Draw throttle/speed indicator
        this.drawThrottleEffect(ctx);
        
        // Near left edge - draw indicator on right side
        if (this.x < edgeThreshold) {
            const alpha = 1 - (this.x / edgeThreshold); // Fade based on distance
            ctx.globalAlpha = alpha * 0.8;
            
            // Right edge indicator
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.moveTo(this.game.width - 5, this.y + this.height / 2);
            ctx.lineTo(this.game.width - indicatorSize, this.y + this.height / 2 - indicatorSize / 2);
            ctx.lineTo(this.game.width - indicatorSize, this.y + this.height / 2 + indicatorSize / 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw miniature ship icon
            ctx.beginPath();
            ctx.arc(this.game.width - indicatorSize - 5, this.y + this.height / 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        // Near right edge - draw indicator on left side
        if (this.x > this.game.width - this.width - edgeThreshold) {
            const alpha = 1 - ((this.game.width - this.width - this.x) / edgeThreshold);
            ctx.globalAlpha = alpha * 0.8;
            
            // Left edge indicator
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.moveTo(5, this.y + this.height / 2);
            ctx.lineTo(indicatorSize, this.y + this.height / 2 - indicatorSize / 2);
            ctx.lineTo(indicatorSize, this.y + this.height / 2 + indicatorSize / 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw miniature ship icon
            ctx.beginPath();
            ctx.arc(indicatorSize + 5, this.y + this.height / 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        ctx.restore();
    }

    // New method to draw throttle/speed effect
    drawThrottleEffect(ctx) {
        try {
            // Calculate throttle percentage
            const horizontalSpeed = Math.abs(this.velocityX) / this.maxSpeed;
            const verticalSpeed = Math.abs(this.velocityY) / this.maxSpeed;
            
            // Base position (centered on player)
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // Draw horizontal throttle indicator (gas exhaust)
            if (Math.abs(this.velocityX) > 0.5) {
                // Set direction and color
                const direction = this.velocityX > 0 ? 1 : -1;
                const baseColor = this.velocityX > 0 ? '#66CCFF' : '#6699FF';
                
                // Calculate strength based on speed
                const strength = Math.min(horizontalSpeed * 2, 1) * 50; // Max 50px long
                const particleCount = Math.min(Math.floor(horizontalSpeed * 10) + 5, 15); // Limit particles
                
                // Draw gas particles
                for (let i = 0; i < particleCount; i++) {
                    const particleSize = Math.min((Math.random() * 3 + 2) * horizontalSpeed, 5);
                    const distance = Math.random() * strength;
                    const yVariation = (Math.random() - 0.5) * 15 * horizontalSpeed;
                    
                    // Particle opacity based on distance
                    ctx.globalAlpha = Math.max(0.1, 1 - (distance / strength)) * 0.8;
                    
                    // Particle shape (gas puffs)
                    ctx.beginPath();
                    ctx.arc(
                        centerX - (direction * distance),
                        centerY + yVariation,
                        particleSize,
                        0, Math.PI * 2
                    );
                    
                    // Color varies from white to base color
                    const colorRatio = distance / strength;
                    ctx.fillStyle = colorRatio < 0.3 ? 'rgba(255, 255, 255, 0.8)' : baseColor;
                    ctx.fill();
                }
                
                // Add a simple central exhaust stream
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - 5);
                ctx.lineTo(centerX - (direction * strength * 0.7), centerY);
                ctx.lineTo(centerX, centerY + 5);
                ctx.closePath();
                ctx.fill();
            }
            
            // Draw vertical throttle indicator (gas exhaust)
            if (Math.abs(this.velocityY) > 0.5) {
                // Set direction and color
                const direction = this.velocityY > 0 ? 1 : -1;
                const baseColor = this.velocityY > 0 ? '#FF9966' : '#66FF99'; // Red for down, green for up
                
                // Calculate strength based on speed
                const strength = Math.min(verticalSpeed * 2, 1) * 50; // Max 50px long
                const particleCount = Math.min(Math.floor(verticalSpeed * 10) + 5, 15); // Limit particles
                
                // Draw gas particles
                for (let i = 0; i < particleCount; i++) {
                    const particleSize = Math.min((Math.random() * 3 + 2) * verticalSpeed, 5);
                    const distance = Math.random() * strength;
                    const xVariation = (Math.random() - 0.5) * 15 * verticalSpeed;
                    
                    // Particle opacity based on distance
                    ctx.globalAlpha = Math.max(0.1, 1 - (distance / strength)) * 0.8;
                    
                    // Particle shape (gas puffs)
                    ctx.beginPath();
                    ctx.arc(
                        centerX + xVariation,
                        centerY - (direction * distance),
                        particleSize,
                        0, Math.PI * 2
                    );
                    
                    // Color varies from white to base color
                    const colorRatio = distance / strength;
                    ctx.fillStyle = colorRatio < 0.3 ? 'rgba(255, 255, 255, 0.8)' : baseColor;
                    ctx.fill();
                }
                
                // Add a simple central exhaust stream
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX, centerY - (direction * strength * 0.7));
                ctx.lineTo(centerX + 5, centerY);
                ctx.closePath();
                ctx.fill();
            }
            
            // Reset alpha
            ctx.globalAlpha = 1.0;
        } catch (error) {
            // Fallback in case of error
            console.error("Error in throttle effect:", error);
            ctx.globalAlpha = 1.0;
        }
    }

    drawBulletCounts(ctx) {
        const startX = 20;
        const startY = 240;
        const spacing = 20;
        
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        
        let index = 0;
        for (const key in this.gunTypes) {
            const gunType = this.gunTypes[key];
            if (gunType !== 'basic') { // Don't display basic gun ammo count (infinite)
                const bulletCount = this.gun.getBulletCount(gunType);
                const isActive = this.gunType === gunType;
                
                // Highlight active gun
                if (isActive) {
                    ctx.fillStyle = this.gun.projectileColor;
                    ctx.fillRect(startX - 15, startY + (spacing * index) - 10, 10, 10);
                }
                
                // Show gun type and bullet count
                ctx.fillStyle = bulletCount > 0 ? '#FFFFFF' : '#888888';
                ctx.fillText(`${key}:${gunType.toUpperCase()} ${bulletCount}`, startX, startY + (spacing * index));
                index++;
            }
        }
    }

    hit() {
        if (!this.invulnerable) {
            this.health -= 20;
            
            if (this.health <= 0) {
                this.health = 100;
                this.lives--;
                
                if (this.lives <= 0) {
                    this.game.gameOver = true;
                }
            }
            
            // Make player invulnerable for a short time after being hit
            this.invulnerable = true;
            this.invulnerableTimer = 0;
            
            // Add visual feedback for being hit
            this.game.effectsManager.createHitEffect(
                this.x + this.width/2,
                this.y + this.height/2,
                40,
                '#FF3333'
            );
            
            // Add screen shake
            this.game.addScreenShake(3, 5);
        }
    }

    // Add method to activate nuclear weapon
    activateNuclearWeapon() {
        if (this.nuclearWeapons <= 0) return;
        
        // Reduce count and set cooldown
        this.nuclearWeapons--;
        this.nuclearCooldown = this.nuclearCooldownTime;
        
        // Create nuclear explosion effect at the center of the screen
        this.game.effectsManager.createNuclearExplosion(this.game.width / 2, this.game.height / 2);
        
        // Handle boss differently - only reduce health by half
        if (this.game.enemyManager.boss) {
            const boss = this.game.enemyManager.boss;
            // Save current boss health and reduce by half
            const currentHealth = boss.health;
            const damageAmount = Math.ceil(currentHealth / 2);
            boss.hit(damageAmount);
            
            // Create hit effect on boss
            this.game.effectsManager.createHitEffect(
                boss.x + boss.width/2,
                boss.y + boss.height/2,
                50,
                '#FF0000'
            );
            
            // Add notification about boss damage
            this.game.notificationManager.addNotification('BOSS DAMAGED', '#FF0000', 90);
        }
        
        // Destroy all regular enemies and add score
        const enemiesDestroyed = this.game.enemyManager.destroyAllEnemies(true); // Pass true to exclude boss
        
        // Add score for each enemy destroyed
        this.game.score += enemiesDestroyed * 10;
        
        // Add screen shake
        this.game.addScreenShake(15, 30);
        
        // Display notification
        this.game.notificationManager.addNotification('NUCLEAR STRIKE', '#FF0000', 120);
    }
    
    // Add method to collect a nuclear weapon
    collectNuclearWeapon() {
        if (this.nuclearWeapons < this.maxNuclearWeapons) {
            this.nuclearWeapons++;
            return true;
        }
        return false;
    }

    launchMissiles() {
        // Check if player has missiles and cooldown is ready
        if (this.missileCount <= 0 || this.missileCooldown > 0) return;
        
        // Set cooldown
        this.missileCooldown = this.missileCooldownTime;
        
        // Calculate how many missiles to launch (up to 5, based on available count)
        const missilesToLaunch = Math.min(this.missilesPerLaunch, this.missileCount);
        this.missileCount -= missilesToLaunch;
        
        // Find initial targets for missiles
        const targets = this.findInitialTargets(missilesToLaunch);
        
        // Create missile launch positions (spread pattern)
        const launchPositions = [];
        for (let i = 0; i < missilesToLaunch; i++) {
            // Calculate spread position
            const offsetX = (i - (missilesToLaunch - 1) / 2) * 15;
            launchPositions.push({
                x: this.x + this.width / 2 + offsetX,
                y: this.y
            });
        }
        
        // Create missiles
        for (let i = 0; i < missilesToLaunch; i++) {
            const missile = new Missile(
                this.game,
                launchPositions[i].x,
                launchPositions[i].y,
                targets[i]
            );
            this.missiles.push(missile);
        }
        
        // Add notification
        this.game.notificationManager.addNotification(`LAUNCHED ${missilesToLaunch} MISSILES`, '#FF6600');
        
        // Add screen shake
        this.game.addScreenShake(3, 10);
    }
    
    findInitialTargets(count) {
        const targets = [];
        const enemies = [...this.game.enemyManager.enemies];
        
        // Prioritize boss if present
        if (this.game.enemyManager.boss) {
            targets.push(this.game.enemyManager.boss);
            count--;
        }
        
        // Sort enemies by distance to player
        enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - this.x, a.y - this.y);
            const distB = Math.hypot(b.x - this.x, b.y - this.y);
            return distA - distB;
        });
        
        // Add closest enemies as targets
        for (let i = 0; i < count && i < enemies.length; i++) {
            targets.push(enemies[i]);
        }
        
        // If we don't have enough targets, fill with null (missiles will find targets later)
        while (targets.length < count) {
            targets.push(null);
        }
        
        return targets;
    }
    
    collectMissiles(amount) {
        const oldCount = this.missileCount;
        this.missileCount = Math.min(this.missileCount + amount, this.maxMissiles);
        const actualAdded = this.missileCount - oldCount;
        
        // Visual confirmation
        this.game.effectsManager.createHitEffect(
            this.x + this.width/2,
            this.y + this.height/2,
            20,
            '#FF6600'
        );
        
        return actualAdded;
    }

    // Add fallback sprite method in case image loading fails
    createFallbackSprite() {
        // Create a simple ship shape as fallback
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Ship body
        ctx.fillStyle = '#3366CC';
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width * 0.2, this.height * 0.7);
        ctx.lineTo(0, this.height * 0.8);
        ctx.lineTo(this.width * 0.3, this.height);
        ctx.lineTo(this.width * 0.7, this.height);
        ctx.lineTo(this.width, this.height * 0.8);
        ctx.lineTo(this.width * 0.8, this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#88AAFF';
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height * 0.4, 6, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
} 