export class EffectsManager {
    constructor(game) {
        this.game = game;
        this.effects = [];
    }
    
    update() {
        // Update all effects
        this.effects.forEach((effect, index) => {
            effect.update();
            // Remove completed effects
            if (effect.markedForDeletion) {
                this.effects.splice(index, 1);
            }
        });
    }
    
    draw(ctx) {
        // Draw all effects
        this.effects.forEach(effect => {
            effect.draw(ctx);
        });
    }
    
    createHitEffect(x, y, size = 15, color = '#FFFFFF') {
        // Create a hit effect (flash and particles)
        this.effects.push(new HitEffect(this.game, x, y, size, color));
    }
    
    createExplosion(x, y, size = 30) {
        // Create an explosion effect (expanding circle and particles)
        this.effects.push(new ExplosionEffect(this.game, x, y, size));
    }
    
    createNuclearExplosion(x, y) {
        // Create a massive nuclear explosion effect
        this.effects.push(new NuclearExplosionEffect(this.game, x, y));
    }
}

class Effect {
    constructor(game, x, y, size) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = size;
        this.markedForDeletion = false;
    }
    
    update() {
        // To be overridden by child classes
    }
    
    draw(ctx) {
        // To be overridden by child classes
    }
}

class HitEffect extends Effect {
    constructor(game, x, y, size, color = '#FFFFFF') {
        super(game, x, y, size);
        this.frame = 0;
        this.maxFrame = 10;
        this.particles = [];
        this.color = color;
        
        // Create particles on hit
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                size: Math.random() * 5 + 2,
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * 6 - 3,
                color: this.color,
                alpha: 1
            });
        }
    }
    
    update() {
        this.frame++;
        if (this.frame >= this.maxFrame) {
            this.markedForDeletion = true;
        }
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.size *= 0.9;
            particle.alpha *= 0.9;
        });
    }
    
    draw(ctx) {
        // Draw hit flash (circular)
        const alpha = 1 - this.frame / this.maxFrame;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
        
        // Draw particles (circular)
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

class ExplosionEffect extends Effect {
    constructor(game, x, y, size) {
        super(game, x, y, size);
        this.frame = 0;
        this.maxFrame = 20;
        this.particles = [];
        this.rings = [];
        
        // Create expanding rings
        this.rings.push({
            size: 0,
            maxSize: this.size,
            alpha: 1,
            color: '#FF5500'
        });
        
        this.rings.push({
            size: 0,
            maxSize: this.size * 0.7,
            alpha: 0.8,
            color: '#FFAA00'
        });
        
        // Create particles for explosion
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                size: Math.random() * 4 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: i % 2 === 0 ? '#FF5500' : '#FFAA00',
                alpha: 1
            });
        }
    }
    
    update() {
        this.frame++;
        if (this.frame >= this.maxFrame) {
            this.markedForDeletion = true;
        }
        
        // Update rings
        this.rings.forEach(ring => {
            ring.size += (ring.maxSize - ring.size) * 0.2;
            ring.alpha *= 0.9;
        });
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.speedX *= 0.95;
            particle.speedY *= 0.95;
            particle.size *= 0.92;
            particle.alpha *= 0.92;
        });
    }
    
    draw(ctx) {
        // Draw explosion rings
        this.rings.forEach(ring => {
            ctx.save();
            ctx.globalAlpha = ring.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ring.size, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.restore();
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.restore();
        });
    }
}

class NuclearExplosionEffect extends Effect {
    constructor(game, x, y) {
        super(game, x, y, 200); // Large size for nuclear explosion
        this.frame = 0;
        this.maxFrame = 60; // Longer animation
        this.particles = [];
        this.rings = [];
        this.shockwaves = [];
        
        // Create expanding rings
        this.rings.push({
            size: 0,
            maxSize: this.game.width * 1.5, // Cover the entire screen
            alpha: 0.8,
            color: '#FF5500'
        });
        
        // Create shockwave rings
        for (let i = 0; i < 3; i++) {
            this.shockwaves.push({
                size: 0,
                maxSize: this.game.width * (0.5 + i * 0.5),
                alpha: 0.6 - i * 0.15,
                color: 'rgba(255, 255, 255, 0.8)',
                delay: i * 10 // Stagger the shockwaves
            });
        }
        
        // Create particles for nuclear explosion
        const particleCount = 200;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 2;
            const size = Math.random() * 8 + 4;
            const color = i % 3 === 0 ? '#FF5500' : (i % 3 === 1 ? '#FFAA00' : '#FFFFFF');
            
            this.particles.push({
                x: this.x,
                y: this.y,
                size: size,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                gravity: 0.05,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // Nuclear flash effect - white out the screen briefly
        this.flashAlpha = 1;
    }
    
    update() {
        this.frame++;
        if (this.frame >= this.maxFrame) {
            this.markedForDeletion = true;
        }
        
        // Update flash
        this.flashAlpha = Math.max(0, this.flashAlpha - 0.05);
        
        // Update rings
        this.rings.forEach(ring => {
            // Accelerate growth then slow down
            const growthRate = (this.maxFrame - this.frame) / this.maxFrame;
            ring.size += (ring.maxSize - ring.size) * 0.08 * (1 + growthRate);
            ring.alpha *= 0.95;
        });
        
        // Update shockwaves
        this.shockwaves.forEach(wave => {
            if (this.frame >= wave.delay) {
                // Focused growth animation
                wave.size += (wave.maxSize - wave.size) * 0.12;
                wave.alpha *= 0.95;
            }
        });
        
        // Update particles
        this.particles.forEach(particle => {
            // Update position with gravity
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.speedY += particle.gravity;
            
            // Slow down over time
            particle.speedX *= 0.98;
            particle.speedY *= 0.98;
            
            // Rotate particles
            particle.rotation += particle.rotationSpeed;
            
            // Fade out and shrink
            particle.size *= 0.96;
            particle.alpha *= 0.97;
        });
    }
    
    draw(ctx) {
        // Draw initial flash (white out effect)
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            ctx.restore();
        }
        
        // Draw shockwaves (white rings)
        this.shockwaves.forEach(wave => {
            if (wave.size > 0) {
                ctx.save();
                ctx.globalAlpha = wave.alpha;
                ctx.strokeStyle = wave.color;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(this.x, this.y, wave.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // Draw explosion rings
        this.rings.forEach(ring => {
            ctx.save();
            ctx.globalAlpha = ring.alpha;
            
            // Create gradient for ring
            const gradient = ctx.createRadialGradient(
                this.x, this.y, ring.size * 0.4,
                this.x, this.y, ring.size
            );
            gradient.addColorStop(0, '#FFAA00');
            gradient.addColorStop(0.5, '#FF5500');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ring.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // Draw with glow
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = particle.color;
            
            // Draw as squares
            ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            
            ctx.restore();
        });
    }
} 