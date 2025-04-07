import { Player } from './Player.js';
import { EnemyManager } from './EnemyManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { InputHandler } from '../utils/InputHandler.js';
import { CollisionManager } from '../utils/CollisionManager.js';
import { EffectsManager } from './EffectsManager.js';
import { NotificationManager } from './NotificationManager.js';
import { Background } from './Background.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        
        // Adjust canvas size based on device
        this.setupCanvas();
        
        this.inputHandler = new InputHandler();
        this.player = new Player(this);
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.collisionManager = new CollisionManager(this);
        this.effectsManager = new EffectsManager(this);
        this.notificationManager = new NotificationManager(this);
        this.background = new Background(this);
        
        // Active power-ups tracking
        this.activePowerUps = {
            agilityActive: this.player.agilityActive,
            thrustActive: this.player.thrustActive,
            godModeActive: this.player.godModeActive
        };
        
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        
        // Game state
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        
        // Reset key handler
        this.restartListener = this.handleRestart.bind(this);
        window.addEventListener('keydown', this.restartListener);
        
        // Pause listener
        this.togglePauseListener = this.togglePause.bind(this);
        window.addEventListener('togglePause', this.togglePauseListener);
        
        // Screen shake effect
        this.screenShake = {
            active: false,
            intensity: 0,
            duration: 0,
            timer: 0
        };
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    // Add this method to set up the canvas based on device
    setupCanvas() {
        if (this.isMobileDevice()) {
            // Fill the screen on mobile
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        } else {
            // Fixed size for desktop
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    }
    
    // Method to detect if this is a mobile device
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
              (window.innerWidth <= 800 && window.innerHeight <= 900);
    }
    
    // Handle window resize
    handleResize() {
        if (this.isMobileDevice()) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }
    }
    
    start() {
        this.gameLoop(0);
    }
    
    gameLoop(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;
        
        if (this.frameTimer > this.frameInterval) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // Only update if game is not paused
            if (!this.isPaused) {
                this.update(deltaTime);
            }
            
            this.draw();
            
            this.frameTimer = 0;
        } else {
            this.frameTimer += deltaTime;
        }
        
        if (!this.gameOver) {
            requestAnimationFrame(this.gameLoop.bind(this));
        } else {
            this.showGameOver();
        }
    }
    
    update(deltaTime) {
        this.player.update(deltaTime);
        this.enemyManager.update(deltaTime);
        this.powerUpManager.update(deltaTime);
        this.collisionManager.checkCollisions();
        this.effectsManager.update();
        this.notificationManager.update();
        
        // Update active power-ups tracking
        this.activePowerUps = {
            agilityActive: this.player.agilityActive,
            thrustActive: this.player.thrustActive,
            godModeActive: this.player.godModeActive
        };
        
        // Update background with player velocity
        this.background.update(this.player.velocityX, this.player.velocityY);
        
        // Update screen shake
        if (this.screenShake.active) {
            this.screenShake.timer--;
            if (this.screenShake.timer <= 0) {
                this.screenShake.active = false;
            }
        }
    }
    
    draw() {
        // Apply screen shake if active
        if (this.screenShake.active) {
            const shakeX = (Math.random() * 2 - 1) * this.screenShake.intensity;
            const shakeY = (Math.random() * 2 - 1) * this.screenShake.intensity;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw background
        this.background.draw(this.ctx);
        
        // Draw game elements
        this.enemyManager.draw(this.ctx);
        this.powerUpManager.draw(this.ctx);
        this.effectsManager.draw(this.ctx);
        this.player.draw(this.ctx);
        
        // Draw UI
        this.drawUI();
        
        // Draw notifications
        this.notificationManager.draw(this.ctx);
        
        // Draw nuclear weapon icons on the right side
        this.drawNuclearWeapons();
        this.drawMissileCount();
        
        // Draw pause overlay if game is paused
        if (this.isPaused) {
            this.drawPauseOverlay();
        }
        
        // Draw mobile UI elements if on mobile
        this.inputHandler.drawMobileUI(this.ctx);
        
        // Restore canvas if screen shake was applied
        if (this.screenShake.active) {
            this.ctx.restore();
        }
    }
    
    drawUI() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
        
        // Draw current wave
        this.ctx.fillText(`WAVE: ${this.enemyManager.currentWave}`, 20, 60);
        
        // Draw health bar
        this.ctx.fillText(`HEALTH:`, 20, 90);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.strokeRect(130, 75, 100, 15);
        this.ctx.fillStyle = this.player.health > 30 ? '#33FF33' : '#FF3333';
        this.ctx.fillRect(130, 75, this.player.health, 15);
        
        // Draw lives
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`LIVES: ${this.player.lives}`, 20, 120);
        
        // Draw gun type with bullet count
        this.ctx.fillStyle = '#FFFFFF';
        // const gunType = this.player.gunType.toUpperCase();
        // let ammoText = '';
        
        // if (this.player.gunType === 'basic') {
        //     ammoText = "∞"; // Infinity symbol for basic gun
        // } else {
        //     const bulletCount = this.player.gun.getBulletCount(this.player.gunType);
        //     ammoText = bulletCount.toString();
        // }
        
        // this.ctx.fillText(`GUN: ${gunType}`, 20, 150);
        // this.ctx.fillText(`AMMO: ${ammoText}`, 20, 180);
        
        // Draw velocity indicator
        // const speed = Math.sqrt(Math.pow(this.player.velocityX, 2) + Math.pow(this.player.velocityY, 2));
        // const normalizedSpeed = Math.floor((speed / this.player.maxSpeed) * 100);
        // this.ctx.fillText(`SPEED: ${normalizedSpeed}%`, 20, 210);
        
        // Active power-ups display
        this.drawActivePowerUps();
    }
    
    drawActivePowerUps() {
        // Set up dimensions
        const startX = this.width - 50;
        const startY = 20;
        const boxSize = 25; // Smaller icons
        const margin = 10;
        
        // Check if any power-ups are active
        const hasActivePowerUps = this.player.agilityActive || 
                                 this.player.thrustActive || 
                                 this.player.godModeActive;
        
        if (!hasActivePowerUps) return; // Don't draw anything if no special power-ups active
        
        // No background panel anymore
        
        let currentY = startY;
        
        // Agility boost
        if (this.player.agilityActive) {
            this.drawPowerUpIcon('agility', startX - boxSize/2, currentY, boxSize);
            
            // Add timer
            const remainingTime = Math.ceil((this.player.powerUpDuration - this.player.agilityTimer) / 60);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${remainingTime}s`, startX, currentY + boxSize + 10);
            
            currentY += boxSize + margin;
        }
        
        // Thrust boost
        if (this.player.thrustActive) {
            this.drawPowerUpIcon('thrust', startX - boxSize/2, currentY, boxSize);
            
            // Add timer
            const remainingTime = Math.ceil((this.player.powerUpDuration - this.player.thrustTimer) / 60);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${remainingTime}s`, startX, currentY + boxSize + 10);
            
            currentY += boxSize + margin;
        }
        
        // God mode
        if (this.player.godModeActive) {
            this.drawPowerUpIcon('godmode', startX - boxSize/2, currentY, boxSize);
            
            // Add timer
            const remainingTime = Math.ceil((this.player.invulnerableDuration - this.player.invulnerableTimer) / 60);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${remainingTime}s`, startX, currentY + boxSize + 10);
        }
    }
    
    drawPowerUpIcon(type, x, y, size) {
        // Set color based on power-up type
        let color;
        switch(type) {
            case 'agility': color = '#66FFCC'; break;
            case 'thrust': color = '#FFCC33'; break;
            case 'godmode': color = '#FFFFFF'; break;
            default: color = '#AAAAAA';
        }
        
        // Draw icon background
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size, size);
        
        // Draw border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Draw icon symbol based on type
        this.ctx.fillStyle = '#000000';
        switch(type) {
            case 'agility':
                // Curved arrows
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size * 0.3, Math.PI * 0.75, Math.PI * 2, false);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                // Arrow tip
                this.ctx.beginPath();
                this.ctx.moveTo(x + size * 0.75, y + size * 0.35);
                this.ctx.lineTo(x + size * 0.8, y + size * 0.55);
                this.ctx.lineTo(x + size * 0.6, y + size * 0.5);
                this.ctx.fill();
                break;
            case 'thrust':
                // Rocket/thrust icon
                this.ctx.beginPath();
                this.ctx.moveTo(x + size * 0.5, y + size * 0.2);
                this.ctx.lineTo(x + size * 0.7, y + size * 0.8);
                this.ctx.lineTo(x + size * 0.5, y + size * 0.65);
                this.ctx.lineTo(x + size * 0.3, y + size * 0.8);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'godmode':
                // Star icon
                this.ctx.beginPath();
                const points = 5;
                const outerRadius = size * 0.4;
                const innerRadius = size * 0.2;
                const centerX = x + size/2;
                const centerY = y + size/2;
                
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / points;
                    const pointX = centerX + radius * Math.sin(angle);
                    const pointY = centerY + radius * Math.cos(angle);
                    
                    if (i === 0) {
                        this.ctx.moveTo(pointX, pointY);
                    } else {
                        this.ctx.lineTo(pointX, pointY);
                    }
                }
                
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }
    
    // Add method to draw nuclear weapons
    drawNuclearWeapons() {
        const iconSize = 30;
        const startX = this.width - 45;
        const startY = this.height - 50;
        
        // Draw nuclear weapons count
        for (let i = 0; i < this.player.nuclearWeapons; i++) {
            // Nuclear weapon icon
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(startX, startY - (i * 40), iconSize, iconSize);
            
            // Border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(startX, startY - (i * 40), iconSize, iconSize);
            
            // Nuclear symbol
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(startX + iconSize/2, startY - (i * 40) + iconSize/2, 10, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Radiation symbol lines
            for (let j = 0; j < 3; j++) {
                const angle = (j * Math.PI * 2) / 3;
                this.ctx.save();
                this.ctx.translate(startX + iconSize/2, startY - (i * 40) + iconSize/2);
                this.ctx.rotate(angle);
                this.ctx.fillRect(-2, 0, 4, 8);
                this.ctx.restore();
            }
        }
        
        // Draw "Press E" text if player has nukes
        if (this.player.nuclearWeapons > 0) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PRESS E', startX + iconSize/2, startY + iconSize + 15);
        }
    }
    
    drawMissileCount() {
        // Draw missile count on the right side of the screen
        const ctx = this.ctx;
        const player = this.player;
        
        if (player.missileCount > 0) {
            const baseX = this.width - 70;
            const baseY = 160;
            
            // Draw title
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FF6600';
            ctx.fillText('MISSILES', baseX - 50, baseY - 10);
            
            // Draw missile count
            ctx.font = '24px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(player.missileCount, baseX + 15, baseY + 20);
            
            // Draw missile icon
            ctx.fillStyle = '#FF6600';
            // Missile body
            ctx.fillRect(baseX - 20, baseY, 20, 30);
            // Missile head
            ctx.beginPath();
            ctx.moveTo(baseX - 20, baseY);
            ctx.lineTo(baseX - 10, baseY - 10);
            ctx.lineTo(baseX, baseY);
            ctx.fill();
            // Fins
            ctx.beginPath();
            ctx.moveTo(baseX - 20, baseY + 30);
            ctx.lineTo(baseX - 30, baseY + 40);
            ctx.lineTo(baseX - 20, baseY + 20);
            ctx.fill();
            
            // Draw "PRESS Q" text if missiles are available
            ctx.font = '12px Arial';
            ctx.fillStyle = '#FFCC00';
            ctx.fillText('PRESS Q', baseX - 40, baseY + 45);
        }
    }
    
    showGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '40px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
        
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 50);
        this.ctx.fillText('Press SPACE to restart', this.width / 2, this.height / 2 + 100);
        
        // Add control instructions
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillText('CONTROLS: W/A/S/D to move, SPACE to shoot, E for nukes', this.width / 2, this.height / 2 + 150);
        this.ctx.fillText('R - RESTART GAME', this.width/2, this.height/2 + 175);
        this.ctx.fillText('P - PAUSE GAME', this.width/2, this.height/2 + 195);
        this.ctx.fillText('E - NUCLEAR WEAPON', this.width/2, this.height/2 + 215);
        this.ctx.fillText('Q - MISSILE LAUNCHER', this.width/2, this.height/2 + 235);
    }
    
    handleRestart(e) {
        if (this.gameOver && e.key === ' ') {
            this.restart();
        }
    }
    
    restart() {
        this.gameOver = false;
        this.score = 0;
        this.player = new Player(this);
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.effectsManager = new EffectsManager(this);
        this.notificationManager = new NotificationManager(this);
        this.background = new Background(this);
        
        // Reset active power-up tracking
        this.activePowerUps = {
            agilityActive: false,
            thrustActive: false,
            godModeActive: false
        };
        
        this.start();
    }
    
    // Add method to trigger screen shake
    addScreenShake(intensity = 5, duration = 10) {
        this.screenShake.active = true;
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.screenShake.timer = duration;
    }
    
    // Toggle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        
        // Add notification when game is paused/unpaused
        if (this.isPaused) {
            this.notificationManager.addNotification('GAME PAUSED', '#FFFFFF', 90);
        } else {
            this.notificationManager.addNotification('GAME RESUMED', '#FFFFFF', 90);
        }
    }
    
    // Draw pause overlay
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '40px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 20);
        
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 30);
    }
    
    // Cleanup event listeners when game is destroyed
    cleanup() {
        window.removeEventListener('keydown', this.restartListener);
        window.removeEventListener('togglePause', this.togglePauseListener);
    }
} 