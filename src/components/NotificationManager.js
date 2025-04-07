export class NotificationManager {
    constructor(game) {
        this.game = game;
        this.notifications = [];
        this.maxNotifications = 3; // Maximum number of notifications displayed at once
    }
    
    update() {
        // Update all notifications
        this.notifications.forEach((notification, index) => {
            notification.timer--;
            
            // Remove expired notifications
            if (notification.timer <= 0) {
                this.notifications.splice(index, 1);
            }
        });
    }
    
    draw(ctx) {
        // Set text properties
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw notifications from bottom to top
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            const y = this.game.height - 80 - (i * 30);
            
            // Calculate fade-in/fade-out effect
            let alpha = 1;
            const fadeTime = 15; // frames for fading
            
            if (notification.timer < fadeTime) {
                alpha = notification.timer / fadeTime;
            } else if (notification.duration - notification.timer < fadeTime) {
                alpha = (notification.duration - notification.timer) / fadeTime;
            }
            
            // Background for text
            ctx.save();
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = 'black';
            ctx.fillRect(
                this.game.width / 2 - ctx.measureText(notification.text).width / 2 - 10,
                y - 15,
                ctx.measureText(notification.text).width + 20,
                30
            );
            ctx.restore();
            
            // Draw text with color
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = notification.color;
            ctx.fillText(notification.text, this.game.width / 2, y);
            
            // Add outline to text for better visibility
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeText(notification.text, this.game.width / 2, y);
            ctx.restore();
        }
    }
    
    addNotification(text, color = '#FFFFFF', duration = 60) {
        // Add new notification to the top of the array
        this.notifications.unshift({
            text,
            color,
            timer: duration,
            duration
        });
        
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }
    }
} 