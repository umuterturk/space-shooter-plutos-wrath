export class InputHandler {
    constructor() {
        this.keys = [];
        this.qPressed = false;
        
        window.addEventListener('keydown', (e) => {
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
            if (e.key === 'w' || e.key === 'W') {
                if (this.keys.indexOf('ArrowUp') === -1) this.keys.push('ArrowUp');
            }
            if (e.key === 's' || e.key === 'S') {
                if (this.keys.indexOf('ArrowDown') === -1) this.keys.push('ArrowDown');
            }
            if (e.key === 'a' || e.key === 'A') {
                if (this.keys.indexOf('ArrowLeft') === -1) this.keys.push('ArrowLeft');
            }
            if (e.key === 'd' || e.key === 'D') {
                if (this.keys.indexOf('ArrowRight') === -1) this.keys.push('ArrowRight');
            }
        });
        
        window.addEventListener('keyup', (e) => {
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
                const index = this.keys.indexOf(e.key);
                if (index > -1) {
                    this.keys.splice(index, 1);
                }
            }
            
            // Handle WASD key mapping on release
            if (e.key === 'w' || e.key === 'W') {
                const upIndex = this.keys.indexOf('ArrowUp');
                if (upIndex > -1) this.keys.splice(upIndex, 1);
            }
            if (e.key === 's' || e.key === 'S') {
                const downIndex = this.keys.indexOf('ArrowDown');
                if (downIndex > -1) this.keys.splice(downIndex, 1);
            }
            if (e.key === 'a' || e.key === 'A') {
                const leftIndex = this.keys.indexOf('ArrowLeft');
                if (leftIndex > -1) this.keys.splice(leftIndex, 1);
            }
            if (e.key === 'd' || e.key === 'D') {
                const rightIndex = this.keys.indexOf('ArrowRight');
                if (rightIndex > -1) this.keys.splice(rightIndex, 1);
            }
        });
    }
} 