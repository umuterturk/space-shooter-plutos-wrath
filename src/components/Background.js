export class Background {
    constructor(game) {
        this.game = game;
        
        // Stars for parallax effect
        this.stars = this.generateStars();
        
        // Nebulae for space atmosphere
        this.nebulae = this.generateNebulae();
        
        // Background scroll speed
        this.baseScrollSpeed = 2.5;
        this.scrollSpeed = this.baseScrollSpeed;
        
        // Add distant planet (Pluto)
        this.pluto = this.loadPluto();
    }
    
    generateStars() {
        const stars = [];
        // Create three layers of stars for parallax effect
        const layers = [
            { count: 70, size: [1, 2], speed: 0.7, color: 'rgba(255, 255, 255, 0.5)' },
            { count: 45, size: [2, 3], speed: 1.2, color: 'rgba(255, 255, 255, 0.7)' },
            { count: 25, size: [2, 4], speed: 2.0, color: 'rgba(255, 255, 255, 1.0)' }
        ];
        
        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                stars.push({
                    x: Math.random() * this.game.width,
                    y: Math.random() * this.game.height,
                    size: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
                    speed: layer.speed,
                    color: layer.color
                });
            }
        });
        
        return stars;
    }
    
    generateNebulae() {
        const nebulae = [];
        // Generate distant nebula clouds
        const colors = [
            'rgba(75, 50, 120, 0.15)',
            'rgba(100, 50, 150, 0.1)',
            'rgba(50, 100, 150, 0.12)',
            'rgba(150, 70, 70, 0.08)'
        ];
        
        for (let i = 0; i < 5; i++) {
            nebulae.push({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                width: 200 + Math.random() * 300,
                height: 150 + Math.random() * 200,
                speed: 0.2 + Math.random() * 0.3, // Very slow movement
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        
        return nebulae;
    }
    
    loadPluto() {
        // Load Pluto image
        const image = new Image();
        
        // Define the object first
        const pluto = {
            image: image,
            loaded: false,
            x: this.game.width * 0.9, // Position in the right part of the screen
            y: -this.game.height * 0.2, // Position in the upper part of the screen
            size: this.game.height * 1.2, // Very large size - 60% of screen height
            speed: 0.2, // Very slow movement to appear distant
            rotation: 0, // For very slow rotation
            rotationSpeed: 0.0003 // Incredibly slow rotation
        };
        
        // Set up load handlers before setting src
        image.onload = () => {
            pluto.loaded = true;
            console.log("Pluto image loaded successfully");
        };
        
        image.onerror = (error) => {
            console.error("Error loading Pluto image:", error);
            // Create a fallback circle if image fails to load
            pluto.fallback = true;
        };
        
        // Set the source after setting up handlers
        image.src = 'src/assets/images/pluto.png';
        
        return pluto;
    }
    
    update(playerVelocityX, playerVelocityY) {
        // Adjust scroll speed based on player's forward/backward input
        // But always maintain a minimum forward scroll to create constant forward motion effect
        this.scrollSpeed = this.baseScrollSpeed;
        if (playerVelocityY < 0) {
            // Player is moving forward faster than base speed
            this.scrollSpeed = this.baseScrollSpeed + (Math.abs(playerVelocityY) * 0.3);
        } else if (playerVelocityY > 0) {
            // Player is moving backward, slow the scroll but never reverse it
            this.scrollSpeed = Math.max(this.baseScrollSpeed * 0.5, this.baseScrollSpeed - (playerVelocityY * 0.3));
        }
        
        // Move stars based on scroll speed and player horizontal movement
        this.stars.forEach(star => {
            // Stars always move upward to create forward motion
            star.y += star.speed * this.scrollSpeed;
            
            // Add slight horizontal movement based on player's sideways motion
            star.x -= playerVelocityX * star.speed * 0.3;
            
            // Wrap stars around screen
            if (star.y > this.game.height) {
                star.y = 0;
                star.x = Math.random() * this.game.width;
            }
            if (star.x < 0) star.x = this.game.width;
            if (star.x > this.game.width) star.x = 0;
        });
        
        // Move nebulae (very slow movement)
        this.nebulae.forEach(nebula => {
            nebula.y += nebula.speed * this.scrollSpeed * 0.5;
            
            // Reset nebulae when they move off screen
            if (nebula.y > this.game.height + nebula.height) {
                nebula.y = -nebula.height;
                nebula.x = Math.random() * (this.game.width - nebula.width);
            }
        });
        
        // Update Pluto position (very minimal movement to appear distant)
        if (this.pluto) {
            // Extremely slow vertical movement
            this.pluto.y += this.pluto.speed * this.scrollSpeed * 0.1;
            
            // Extremely slow horizontal movement based on player's movement
            this.pluto.x -= playerVelocityX * this.pluto.speed * 0.05;
            
            // Very slow rotation effect
            this.pluto.rotation += this.pluto.rotationSpeed;
            
            // Reset position if it moves too far off-screen
            if (this.pluto.y > this.game.height + this.pluto.size/2) {
                this.pluto.y = -this.pluto.size/2;
                this.pluto.x = this.game.width * (0.3 + Math.random() * 0.4); // Random X position
            }
        }
    }
    
    draw(ctx) {
        // Deep space background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.game.height);
        bgGradient.addColorStop(0, '#000022');
        bgGradient.addColorStop(1, '#000044');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw distant Pluto
        if (this.pluto) {
            ctx.save();
            ctx.translate(this.pluto.x, this.pluto.y);
            ctx.rotate(this.pluto.rotation);
            
            // Draw with a more subtle glow effect
            ctx.shadowColor = 'rgba(200, 200, 255, 0.1)'; // Reduced glow intensity
            ctx.shadowBlur = 20;
            
            if (this.pluto.loaded) {
                // Apply transparency to make Pluto dimmer
                ctx.globalAlpha = 0.6; // Reduced opacity to 60%
                
                // Draw the planet with image
                ctx.drawImage(
                    this.pluto.image,
                    -this.pluto.size / 2,
                    -this.pluto.size / 2,
                    this.pluto.size,
                    this.pluto.size
                );
            } else if (this.pluto.fallback) {
                // Dim the fallback too
                ctx.globalAlpha = 0.6;
                
                // Draw a simple circular fallback with dimmer colors
                const gradient = ctx.createRadialGradient(
                    0, 0, 0,
                    0, 0, this.pluto.size / 2
                );
                gradient.addColorStop(0, 'rgba(160, 150, 140, 0.7)'); // Dimmer colors
                gradient.addColorStop(0.4, 'rgba(130, 120, 110, 0.7)');
                gradient.addColorStop(0.7, 'rgba(100, 90, 80, 0.7)');
                gradient.addColorStop(1, 'rgba(70, 60, 70, 0.7)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.pluto.size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add some simple craters for texture (dimmer)
                ctx.fillStyle = 'rgba(80, 80, 90, 0.2)';
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * (this.pluto.size / 3);
                    const size = 5 + Math.random() * (this.pluto.size / 10);
                    
                    ctx.beginPath();
                    ctx.arc(
                        Math.cos(angle) * distance,
                        Math.sin(angle) * distance,
                        size, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
            } else {
                // Show loading indicator if neither loaded nor fallback (dimmer)
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = 'rgba(120, 120, 140, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, this.pluto.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Draw distant nebulae
        this.nebulae.forEach(nebula => {
            // Create a radial gradient for each nebula
            const gradient = ctx.createRadialGradient(
                nebula.x + nebula.width/2, nebula.y + nebula.height/2, 0,
                nebula.x + nebula.width/2, nebula.y + nebula.height/2, nebula.width/2
            );
            
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'rgba(0, 0, 30, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                nebula.x, nebula.y, 
                nebula.width, nebula.height
            );
        });
        
        // Draw stars with parallax effect
        this.stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
} 