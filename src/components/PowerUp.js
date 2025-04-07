export class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = 3.5;
        this.markedForDeletion = false;
        
        // Create power-up sprite
        this.sprite = this.createPowerUpSprite();
        
        // Blinking effect
        this.alpha = 1;
        this.fadeDirection = -1; // -1 for fading out, 1 for fading in
        this.fadeSpeed = 0.03;
    }
    
    createPowerUpSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        let color = '#FFFFFF';
        let iconColor = '#000000';
        
        // Color based on power-up type
        switch(this.type) {
            case 'double':
                color = '#33CCFF'; // Blue
                break;
            case 'triple':
                color = '#33FF33'; // Green
                break;
            case 'rapid':
                color = '#FFFF33'; // Yellow
                break;
            case 'plasma':
                color = '#FF33FF'; // Purple
                break;
            case 'speed':
                color = '#FF5533'; // Orange
                break;
            case 'health':
                color = '#FF3333'; // Red
                break;
            case 'agility':
                color = '#66FFCC'; // Teal
                break;
            case 'thrust':
                color = '#FFCC33'; // Gold
                break;
            case 'godmode':
                color = '#FFFFFF'; // White with special effects
                iconColor = '#FFDD00'; // Gold icon
                break;
            case 'nuclear':
                color = '#FF0000'; // Bright red
                iconColor = '#FFFF00'; // Yellow icon
                break;
            case 'missile':
                color = '#FF6600'; // Orange
                iconColor = '#EEEEEE'; // Light grey
                break;
            default:
                color = '#FFFFFF'; // White
        }
        
        // Draw power-up box
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Special effect for godmode - add glow
        if (this.type === 'godmode') {
            const glow = ctx.createRadialGradient(
                this.width/2, this.height/2, 0,
                this.width/2, this.height/2, this.width
            );
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            glow.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
            glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = glow;
            ctx.fillRect(-5, -5, this.width + 10, this.height + 10);
            ctx.restore();
        }
        
        // Special effect for nuclear - add radiation glow
        if (this.type === 'nuclear') {
            const glow = ctx.createRadialGradient(
                this.width/2, this.height/2, 0,
                this.width/2, this.height/2, this.width
            );
            glow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            glow.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = glow;
            ctx.fillRect(-5, -5, this.width + 10, this.height + 10);
            ctx.restore();
        }
        
        // Draw border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
        
        // Draw icon based on power-up type
        ctx.fillStyle = iconColor;
        switch(this.type) {
            case 'double':
                // Two vertical lines
                ctx.fillRect(6, 5, 2, 10);
                ctx.fillRect(12, 5, 2, 10);
                break;
            case 'triple':
                // Three vertical lines
                ctx.fillRect(4, 5, 2, 10);
                ctx.fillRect(9, 5, 2, 10);
                ctx.fillRect(14, 5, 2, 10);
                break;
            case 'rapid':
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(8, 4);
                ctx.lineTo(13, 8);
                ctx.lineTo(9, 10);
                ctx.lineTo(12, 16);
                ctx.lineTo(7, 12);
                ctx.lineTo(11, 9);
                ctx.lineTo(8, 4);
                ctx.fill();
                break;
            case 'plasma':
                // Circle
                ctx.beginPath();
                ctx.arc(10, 10, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'speed':
                // Speedometer-like icon
                ctx.beginPath();
                ctx.arc(10, 10, 6, 0, Math.PI, true);
                ctx.fill();
                ctx.fillRect(4, 10, 12, 2);
                break;
            case 'health':
                // Plus sign
                ctx.fillRect(8, 4, 4, 12);
                ctx.fillRect(4, 8, 12, 4);
                break;
            case 'agility':
                // Curved arrows icon
                ctx.beginPath();
                ctx.arc(10, 10, 6, Math.PI * 0.75, Math.PI * 2, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                // Arrow tip
                ctx.beginPath();
                ctx.moveTo(15, 7);
                ctx.lineTo(16, 11);
                ctx.lineTo(12, 10);
                ctx.fill();
                break;
            case 'thrust':
                // Rocket/thrust icon
                ctx.beginPath();
                ctx.moveTo(10, 4);
                ctx.lineTo(14, 16);
                ctx.lineTo(10, 13);
                ctx.lineTo(6, 16);
                ctx.closePath();
                ctx.fill();
                break;
            case 'godmode':
                // Star icon
                ctx.beginPath();
                const points = 5;
                const outerRadius = 8;
                const innerRadius = 4;
                
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / points;
                    const x = 10 + radius * Math.sin(angle);
                    const y = 10 + radius * Math.cos(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.fill();
                break;
            case 'nuclear':
                // Nuclear symbol
                ctx.beginPath();
                ctx.arc(10, 10, 6, 0, Math.PI * 2);
                ctx.stroke();
                
                // Radiation symbol lines
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    ctx.save();
                    ctx.translate(10, 10);
                    ctx.rotate(angle);
                    ctx.fillRect(-1, 0, 2, 6);
                    ctx.restore();
                }
                break;
            case 'missile':
                // Draw missile icon
                // Missile body
                ctx.fillStyle = '#DDDDDD';
                ctx.fillRect(this.width * 0.3, this.height * 0.25, this.width * 0.4, this.height * 0.5);
                
                // Missile head (cone)
                ctx.beginPath();
                ctx.moveTo(this.width * 0.3, this.height * 0.25);
                ctx.lineTo(this.width * 0.5, this.height * 0.15);
                ctx.lineTo(this.width * 0.7, this.height * 0.25);
                ctx.fillStyle = '#FF3300';
                ctx.fill();
                
                // Fins
                ctx.beginPath();
                ctx.moveTo(this.width * 0.3, this.height * 0.75);
                ctx.lineTo(this.width * 0.2, this.height * 0.85);
                ctx.lineTo(this.width * 0.3, this.height * 0.65);
                ctx.fillStyle = '#FF6600';
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(this.width * 0.7, this.height * 0.75);
                ctx.lineTo(this.width * 0.8, this.height * 0.85);
                ctx.lineTo(this.width * 0.7, this.height * 0.65);
                ctx.fillStyle = '#FF6600';
                ctx.fill();
                
                // Flame
                ctx.beginPath();
                ctx.moveTo(this.width * 0.3, this.height * 0.75);
                ctx.lineTo(this.width * 0.5, this.height * 0.95);
                ctx.lineTo(this.width * 0.7, this.height * 0.75);
                ctx.fillStyle = '#FFCC00';
                ctx.fill();
                break;
        }
        
        return canvas;
    }
    
    update() {
        // Move down
        this.y += this.speed;
        
        // Add slight sideways motion based on game scrolling
        this.x += Math.sin(this.y * 0.02) * 0.5;
        
        // Blinking effect
        this.alpha += this.fadeDirection * this.fadeSpeed;
        if (this.alpha <= 0.4) {
            this.alpha = 0.4;
            this.fadeDirection = 1;
        } else if (this.alpha >= 1) {
            this.alpha = 1;
            this.fadeDirection = -1;
        }
        
        // Check if off screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }
    
    draw(ctx) {
        // Apply alpha for blinking effect
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.sprite, this.x, this.y);
        ctx.globalAlpha = 1;
    }
    
    applyEffect(player) {
        // Create appropriate notification based on power-up type
        let notificationText = '';
        let color = '#FFFFFF';
        
        var BULLET_AMOUNT = 100; 
        
        switch(this.type) {
            case 'double':
                BULLET_AMOUNT = 150;
                // Add bullets to inventory instead of switching guns
                player.gun.addBullets('double', BULLET_AMOUNT);
                notificationText = `+${BULLET_AMOUNT} DOUBLE GUN AMMO`;
                color = '#33CCFF';
                break;
            case 'triple':
                BULLET_AMOUNT = 200;
                // Add bullets to inventory instead of switching guns
                player.gun.addBullets('triple', BULLET_AMOUNT);
                notificationText = `+${BULLET_AMOUNT} TRIPLE GUN AMMO`;
                color = '#33FF33';
                break;
            case 'rapid':
                BULLET_AMOUNT = 250;
                // Add bullets to inventory instead of switching guns
                player.gun.addBullets('rapid', BULLET_AMOUNT);
                notificationText = `+${BULLET_AMOUNT} RAPID FIRE AMMO`;
                color = '#FFFF33';
                break;
            case 'plasma':
                BULLET_AMOUNT = 100;
                // Add bullets to inventory instead of switching guns
                player.gun.addBullets('plasma', BULLET_AMOUNT);
                notificationText = `+${BULLET_AMOUNT} PLASMA AMMO`;
                color = '#FF33FF';
                break;
            case 'speed':
                player.maxSpeed += 1;
                notificationText = 'SPEED BOOST';
                color = '#FF5533';
                break;
            case 'health':
                player.health = Math.min(player.health + 25, 100);
                notificationText = 'HEALTH RESTORED';
                color = '#FF3333';
                break;
            case 'agility':
                // Increase turning/rotation speed and deceleration for better control
                player.rollSpeed = Math.min(player.rollSpeed * 1.4, 0.4); // Cap at 0.4
                player.deceleration = Math.min(player.deceleration * 1.3, 0.2); // Cap at 0.2
                
                // Reset timer and set active status
                player.agilityActive = true;
                player.agilityTimer = 0;
                
                // Visual confirmation
                this.game.effectsManager.createHitEffect(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    30
                );
                
                notificationText = 'AGILITY ENHANCED';
                color = '#66FFCC';
                break;
            case 'thrust':
                // Increase acceleration and max speed
                player.acceleration = Math.min(player.acceleration * 1.3, 0.9); // Cap at 0.9
                player.maxSpeed += 2; // Substantial speed boost
                
                // Reset timer and set active status
                player.thrustActive = true;
                player.thrustTimer = 0;
                
                // Visual confirmation
                this.game.effectsManager.createHitEffect(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    30
                );
                
                notificationText = 'THRUST BOOSTED';
                color = '#FFCC33';
                break;
            case 'godmode':
                // Make player invulnerable for longer period
                player.invulnerable = true;
                player.godModeActive = true;
                player.invulnerableTimer = 0;
                player.invulnerableDuration = 600; // 10 seconds of invulnerability
                
                // Visual confirmation - create special effect
                this.game.effectsManager.createExplosion(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    50
                );
                this.game.addScreenShake(5, 10);
                
                notificationText = 'GOD MODE ACTIVATED';
                color = '#FFFFFF';
                break;
            case 'nuclear':
                if (player.nuclearWeapons < player.maxNuclearWeapons) {
                    player.nuclearWeapons++;
                    notificationText = "NUCLEAR WEAPON ACQUIRED";
                    color = "#FF0000";
                } else {
                    notificationText = "NUCLEAR ARSENAL FULL";
                    color = "#888888";
                }
                break;
            case 'missile':
                const missilesAdded = 5;
                player.collectMissiles(missilesAdded);
                notificationText = `+${missilesAdded} MISSILES`;
                color = "#FF6600";
                break;
        }
        
        // Display notification
        if (notificationText) {
            this.game.notificationManager.addNotification(notificationText, color);
        }
        
        this.markedForDeletion = true;
    }
} 