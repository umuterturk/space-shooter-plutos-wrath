export class Projectile {
    constructor(game, x, y, speed = 7, damage = 10, color = '#33CCFF', width = 4, height = 10) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.xSpeed = 0; // Horizontal speed component
        this.ySpeed = -speed; // Default to upward movement if not set explicitly
        
        // Create projectile sprite
        this.sprite = this.createProjectileSprite();
    }
    
    createProjectileSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Draw a laser beam with custom color
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, this.color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        return canvas;
    }
    
    update() {
        // Apply velocity vector instead of just moving up
        this.y += this.ySpeed;
        this.x += this.xSpeed;
    }
    
    draw(ctx) {
        // Calculate rotation angle based on velocity
        const angle = Math.atan2(this.ySpeed, this.xSpeed) + Math.PI/2;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(angle);
        ctx.drawImage(this.sprite, -this.width/2, -this.height/2);
        ctx.restore();
    }
} 