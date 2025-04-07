export class Enemy {
    constructor(game, x, y, type, scale = {}) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        
        // Get scaling factors (defaults to no scaling)
        this.healthMultiplier = scale.healthMultiplier || 1;
        this.speedMultiplier = scale.speedMultiplier || 1;
        this.scoreMultiplier = scale.scoreMultiplier || 1;
        
        // Hit effect properties
        this.isFlashing = false;
        this.flashDuration = 5;
        this.flashTimer = 0;
        
        // Set properties based on enemy type
        switch(type) {
            case 'small':
                this.width = 24;
                this.height = 24;
                this.baseSpeed = 4.5; // Even faster
                this.health = Math.ceil(15 * this.healthMultiplier); // Scale with wave difficulty
                this.score = Math.ceil(10 * this.scoreMultiplier);
                this.color = '#FF0000';
                break;
            case 'medium':
                this.width = 32;
                this.height = 32;
                this.baseSpeed = 3.5; // Even faster
                this.health = Math.ceil(35 * this.healthMultiplier); // Scale with wave difficulty
                this.score = Math.ceil(20 * this.scoreMultiplier);
                this.color = '#FF6600';
                break;
            case 'large':
                this.width = 48;
                this.height = 48;
                this.baseSpeed = 2.5; // Even faster
                this.health = Math.ceil(70 * this.healthMultiplier); // Scale with wave difficulty
                this.score = Math.ceil(50 * this.scoreMultiplier);
                this.color = '#FF9900';
                break;
            default:
                this.width = 32;
                this.height = 32;
                this.baseSpeed = 3.5;
                this.health = Math.ceil(30 * this.healthMultiplier);
                this.score = Math.ceil(15 * this.scoreMultiplier);
                this.color = '#FF3300';
        }
        
        // Apply speed multiplier
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        // Create enemy sprite
        this.sprite = this.createEnemySprite();
        
        // Movement pattern - more varied patterns
        const randomPattern = Math.random();
        if (randomPattern < 0.3) {
            this.movementPattern = 'straight';
        } else if (randomPattern < 0.6) {
            this.movementPattern = 'zigzag';
        } else if (randomPattern < 0.85) {
            this.movementPattern = 'sine';
        } else {
            this.movementPattern = 'chase'; // New pattern that follows player
        }
        
        this.direction = 1; // 1 for right, -1 for left
        this.zigzagTimer = 0;
        this.zigzagInterval = 30; // frames before changing direction (even faster changes)
        this.sineAmplitude = 50 + Math.random() * 60; // Random amplitude for sine wave pattern
        this.sineFrequency = 0.03 + Math.random() * 0.04; // Random frequency for sine wave pattern
        this.initialX = x; // Starting X position for sine wave pattern
        this.chaseSpeed = this.speed * 0.7; // Speed modifier for chase pattern
    }
    
    createEnemySprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Base shape based on enemy type
        switch(this.type) {
            case 'small':
                // Small triangle ship
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.width / 2, this.height);
                ctx.lineTo(0, 0);
                ctx.lineTo(this.width, 0);
                ctx.closePath();
                ctx.fill();
                
                // Cockpit
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(this.width / 2 - 3, this.height / 2 - 3, 6, 6);
                break;
                
            case 'medium':
                // Medium UFO-like ship
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.width / 2, this.height / 2, this.width / 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Dome
                ctx.fillStyle = '#CCCCFF';
                ctx.beginPath();
                ctx.arc(this.width / 2, this.height / 2 - 5, this.width / 6, 0, Math.PI, true);
                ctx.fill();
                break;
                
            case 'large':
                // Large mothership
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, this.height / 2);
                ctx.lineTo(this.width / 4, 0);
                ctx.lineTo(this.width * 3 / 4, 0);
                ctx.lineTo(this.width, this.height / 2);
                ctx.lineTo(this.width * 3 / 4, this.height);
                ctx.lineTo(this.width / 4, this.height);
                ctx.closePath();
                ctx.fill();
                
                // Windows
                ctx.fillStyle = '#FFFF33';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(this.width / 4 + i * this.width / 6, this.height / 2 - 3, 6, 6);
                }
                break;
                
            default:
                // Default enemy
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, this.width, this.height);
                
                // Details
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.width / 4, this.height / 4, this.width / 2, this.height / 2);
        }
        
        return canvas;
    }
    
    update() {
        // Update flash effect
        if (this.isFlashing) {
            this.flashTimer--;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
            }
        }
        
        // Basic downward movement
        this.y += this.speed;
        
        // Apply movement pattern
        if (this.movementPattern === 'zigzag') {
            this.zigzagTimer++;
            if (this.zigzagTimer >= this.zigzagInterval) {
                this.direction *= -1;
                this.zigzagTimer = 0;
            }
            this.x += this.speed * 1.5 * this.direction;
            
            // Keep within game bounds
            if (this.x <= 0) this.direction = 1;
            if (this.x >= this.game.width - this.width) this.direction = -1;
        } else if (this.movementPattern === 'sine') {
            // Sine wave pattern
            this.x = this.initialX + Math.sin(this.y * this.sineFrequency) * this.sineAmplitude;
            
            // Keep within game bounds
            if (this.x < 0) this.x = 0;
            if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
        } else if (this.movementPattern === 'chase') {
            // Chase player pattern - move toward player's x position
            const playerCenterX = this.game.player.x + this.game.player.width / 2;
            const enemyCenterX = this.x + this.width / 2;
            
            // Move toward player
            if (enemyCenterX < playerCenterX) {
                this.x += this.chaseSpeed;
            } else if (enemyCenterX > playerCenterX) {
                this.x -= this.chaseSpeed;
            }
            
            // Keep within game bounds
            if (this.x < 0) this.x = 0;
            if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
        }
        
        // Check if off screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }
    
    draw(ctx) {
        // Apply flash effect when hit
        if (this.isFlashing) {
            // Draw white silhouette
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
        // Draw normal sprite
        ctx.drawImage(this.sprite, this.x, this.y);
    }
    
    hit(damage) {
        this.health -= damage;
        
        // Trigger flash effect
        this.isFlashing = true;
        this.flashTimer = this.flashDuration;
        
        if (this.health <= 0) {
            this.markedForDeletion = true;
            this.game.score += this.score;
            return true;
        }
        return false;
    }
} 