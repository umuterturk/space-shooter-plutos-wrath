export class InputHandler {
    constructor() {
        this.keys = [];
        this.isMobile = this.detectMobileDevice();
        this.touchStartPos = { x: 0, y: 0 };
        this.touchCurrentPos = { x: 0, y: 0 };
        this.touchThreshold = 20; // Minimum distance to consider as directional movement
        this.virtualButtons = {
            fire: false,
            missile: false,
            nuclear: false,
            pause: false,
            switchWeapon: -1 // -1 means no weapon switch requested
        };
        
        // Desktop controls
        if (!this.isMobile) {
            this.setupKeyboardControls();
        } 
        // Mobile controls
        else {
            this.setupTouchControls();
        }
    }
    
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 800 && window.innerHeight <= 900);
    }
    
    setupKeyboardControls() {
        window.addEventListener('keydown', e => {
            if ((e.key === 'ArrowDown' || 
                 e.key === 'ArrowUp' || 
                 e.key === 'ArrowLeft' || 
                 e.key === 'ArrowRight' ||
                 e.key === 'w' || e.key === 'W' ||
                 e.key === 'a' || e.key === 'A' ||
                 e.key === 's' || e.key === 'S' ||
                 e.key === 'd' || e.key === 'D' ||
                 e.key === ' ' ||
                 e.key === 'e' || e.key === 'E' ||
                 e.key === 'q' || e.key === 'Q' ||
                 (e.key >= '1' && e.key <= '5')) && 
                this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
            
            // Handle P key press for pause separately to avoid adding it to input keys
            if (e.key === 'p' || e.key === 'P') {
                // Create custom event for pause toggle
                const pauseEvent = new CustomEvent('togglePause');
                window.dispatchEvent(pauseEvent);
            }
            
            if (e.key === 'r' || e.key === 'R') window.location.reload();
            
            // Map WASD to arrow keys for compatibility with existing code
            const keyMap = {
                'w': 'ArrowUp',
                'W': 'ArrowUp',
                'a': 'ArrowLeft',
                'A': 'ArrowLeft',
                's': 'ArrowDown',
                'S': 'ArrowDown',
                'd': 'ArrowRight',
                'D': 'ArrowRight'
            };
            
            // Handle WASD mapping
            if (keyMap[e.key] && this.keys.indexOf(keyMap[e.key]) === -1) {
                this.keys.push(keyMap[e.key]);
            }
        });
        
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown' || 
                e.key === 'ArrowUp' || 
                e.key === 'ArrowLeft' || 
                e.key === 'ArrowRight' ||
                e.key === 'w' || e.key === 'W' ||
                e.key === 'a' || e.key === 'A' ||
                e.key === 's' || e.key === 'S' ||
                e.key === 'd' || e.key === 'D' ||
                e.key === ' ' ||
                e.key === 'e' || e.key === 'E' ||
                e.key === 'q' || e.key === 'Q' ||
                (e.key >= '1' && e.key <= '5')) {
                this.keys.splice(this.keys.indexOf(e.key), 1);
                
                // Also remove mapped keys if original key is released
                const keyMap = {
                    'w': 'ArrowUp',
                    'W': 'ArrowUp',
                    'a': 'ArrowLeft',
                    'A': 'ArrowLeft',
                    's': 'ArrowDown',
                    'S': 'ArrowDown',
                    'd': 'ArrowRight',
                    'D': 'ArrowRight'
                };
                
                if (keyMap[e.key] && this.keys.indexOf(keyMap[e.key]) !== -1) {
                    this.keys.splice(this.keys.indexOf(keyMap[e.key]), 1);
                }
            }
        });
    }
    
    setupTouchControls() {
        // Touch events for movement joystick area (left side)
        window.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            
            // Check which part of the screen was touched
            if (touch.clientX < window.innerWidth / 2) {
                // Left side - movement joystick
                this.touchStartPos.x = touch.clientX;
                this.touchStartPos.y = touch.clientY;
                this.touchCurrentPos.x = touch.clientX;
                this.touchCurrentPos.y = touch.clientY;
            } else {
                // Right side - action buttons, handle in the touchControls setup
                this.checkActionButtons(touch.clientX, touch.clientY);
            }
        });
        
        window.addEventListener('touchmove', e => {
            e.preventDefault(); // Prevent scrolling while playing
            const touch = e.touches[0];
            
            // Only process movement for touches on the left side
            if (touch.clientX < window.innerWidth / 2) {
                this.touchCurrentPos.x = touch.clientX;
                this.touchCurrentPos.y = touch.clientY;
                this.updateVirtualJoystick();
            }
        });
        
        window.addEventListener('touchend', e => {
            // Reset all directional keys when touch ends
            this.keys = this.keys.filter(key => 
                key !== 'ArrowUp' && key !== 'ArrowDown' && 
                key !== 'ArrowLeft' && key !== 'ArrowRight'
            );
            
            // Reset virtual button states if needed
            if (e.touches.length === 0) {
                // Only reset fire button - other buttons are "click" actions
                this.virtualButtons.fire = false;
            }
        });
    }
    
    updateVirtualJoystick() {
        // Calculate direction based on touch movement
        const dx = this.touchCurrentPos.x - this.touchStartPos.x;
        const dy = this.touchCurrentPos.y - this.touchStartPos.y;
        
        // Remove all directional keys first
        this.keys = this.keys.filter(key => 
            key !== 'ArrowUp' && key !== 'ArrowDown' && 
            key !== 'ArrowLeft' && key !== 'ArrowRight'
        );
        
        // Apply horizontal movement
        if (dx > this.touchThreshold) {
            this.keys.push('ArrowRight');
        } else if (dx < -this.touchThreshold) {
            this.keys.push('ArrowLeft');
        }
        
        // Apply vertical movement
        if (dy > this.touchThreshold) {
            this.keys.push('ArrowDown');
        } else if (dy < -this.touchThreshold) {
            this.keys.push('ArrowUp');
        }
    }
    
    checkActionButtons(x, y) {
        // Get canvas dimensions for button positioning
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const buttonSize = Math.min(rect.width, rect.height) * 0.12; // Button diameter
        const buttonPadding = buttonSize * 0.3; // Space between buttons
        
        // Convert client coordinates to canvas coordinates
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        
        // Define action button positions (relative to canvas)
        const actionButtons = [
            { name: 'fire', x: rect.width - buttonSize - buttonPadding, y: rect.height - buttonSize * 2 - buttonPadding * 3 },
            { name: 'missile', x: rect.width - buttonSize * 2 - buttonPadding * 2, y: rect.height - buttonSize - buttonPadding * 2 },
            { name: 'nuclear', x: rect.width - buttonSize * 2 - buttonPadding * 2, y: rect.height - buttonSize * 2 - buttonPadding * 3 },
            { name: 'pause', x: rect.width - buttonPadding - buttonSize / 2, y: buttonPadding + buttonSize / 2 }
        ];
        
        // Define weapon switch buttons
        const weaponButtons = [];
        for (let i = 0; i < 5; i++) {
            weaponButtons.push({
                index: i,
                x: rect.width - buttonSize * (5 - i) - buttonPadding, 
                y: buttonPadding * 2 + buttonSize
            });
        }
        
        // Check if an action button was pressed
        actionButtons.forEach(button => {
            const distance = Math.sqrt(
                Math.pow(canvasX - button.x, 2) + 
                Math.pow(canvasY - button.y, 2)
            );
            
            if (distance < buttonSize / 2) {
                // Button was pressed
                if (button.name === 'fire') {
                    // Add space key for shooting
                    if (this.keys.indexOf(' ') === -1) {
                        this.keys.push(' ');
                        this.virtualButtons.fire = true;
                    }
                } else if (button.name === 'missile') {
                    // Add Q key for missile
                    if (this.keys.indexOf('q') === -1) {
                        this.keys.push('q');
                        setTimeout(() => this.keys.splice(this.keys.indexOf('q'), 1), 100);
                    }
                } else if (button.name === 'nuclear') {
                    // Add E key for nuclear
                    if (this.keys.indexOf('e') === -1) {
                        this.keys.push('e');
                        setTimeout(() => this.keys.splice(this.keys.indexOf('e'), 1), 100);
                    }
                } else if (button.name === 'pause') {
                    // Trigger pause event
                    const pauseEvent = new CustomEvent('togglePause');
                    window.dispatchEvent(pauseEvent);
                }
            }
        });
        
        // Check weapon switch buttons
        weaponButtons.forEach(button => {
            const distance = Math.sqrt(
                Math.pow(canvasX - button.x, 2) + 
                Math.pow(canvasY - button.y, 2)
            );
            
            if (distance < buttonSize / 2) {
                // Weapon button was pressed
                const key = (button.index + 1).toString();
                if (this.keys.indexOf(key) === -1) {
                    this.keys.push(key);
                    setTimeout(() => this.keys.splice(this.keys.indexOf(key), 1), 100);
                }
            }
        });
    }
    
    drawMobileUI(ctx) {
        if (!this.isMobile) return;
        
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const buttonSize = Math.min(width, height) * 0.12;
        const buttonPadding = buttonSize * 0.3;
        
        // Draw virtual joystick (left side)
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(width * 0.15, height * 0.75, buttonSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw directional indicator in joystick if active
        if (this.keys.includes('ArrowUp') || this.keys.includes('ArrowDown') || 
            this.keys.includes('ArrowLeft') || this.keys.includes('ArrowRight')) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#66AAFF';
            
            // Calculate joystick position
            let joystickX = width * 0.15;
            let joystickY = height * 0.75;
            
            if (this.keys.includes('ArrowRight')) joystickX += buttonSize * 0.4;
            if (this.keys.includes('ArrowLeft')) joystickX -= buttonSize * 0.4;
            if (this.keys.includes('ArrowDown')) joystickY += buttonSize * 0.4;
            if (this.keys.includes('ArrowUp')) joystickY -= buttonSize * 0.4;
            
            ctx.beginPath();
            ctx.arc(joystickX, joystickY, buttonSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Draw action buttons (right side)
        const actionButtons = [
            { name: 'fire', text: 'FIRE', x: width - buttonSize - buttonPadding, y: height - buttonSize * 2 - buttonPadding * 3, color: '#FF6666' },
            { name: 'missile', text: 'MSL', x: width - buttonSize * 2 - buttonPadding * 2, y: height - buttonSize - buttonPadding * 2, color: '#FF9966' },
            { name: 'nuclear', text: 'NUC', x: width - buttonSize * 2 - buttonPadding * 2, y: height - buttonSize * 2 - buttonPadding * 3, color: '#FF3333' },
            { name: 'pause', text: '❚❚', x: width - buttonPadding - buttonSize / 2, y: buttonPadding + buttonSize / 2, color: '#FFFFFF' }
        ];
        
        // Draw weapon switch buttons
        for (let i = 0; i < 5; i++) {
            const x = width - buttonSize * (5 - i) - buttonPadding;
            const y = buttonPadding * 2 + buttonSize;
            const label = (i + 1).toString();
            
            this.drawButton(ctx, x, y, buttonSize * 0.7, `W${label}`, '#AACCFF');
        }
        
        // Draw action buttons
        actionButtons.forEach(button => {
            this.drawButton(ctx, button.x, button.y, buttonSize, button.text, button.color);
        });
    }
    
    drawButton(ctx, x, y, size, text, color) {
        ctx.save();
        
        // Draw button background
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw button text
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
} 