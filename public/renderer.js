export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.particles = [];
        this.screenShakeTime = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    addParticles(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1.0,
                color: Math.random() > 0.5 ? '#fff' : '#00f2ff'
            });
        }
    }

    shakeScreen(duration) {
        this.screenShakeTime = duration;
    }

    clear() {
        this.ctx.save();
        if (this.screenShakeTime > 0) {
            let dx = (Math.random() - 0.5) * 15;
            let dy = (Math.random() - 0.5) * 15;
            this.ctx.translate(dx, dy);
            this.screenShakeTime--;
        }

        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    endRender() {
        this.ctx.restore();
    }

    // 3D Projection Helper
    getProjected(x, y, z) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Z mapping: 0 is bowler (h * 0.4), 100 is crease (h * 0.85)
        const groundY = h * 0.4 + (z / 100) * (h * 0.45);
        const scale = 0.2 + (z / 100) * 0.8;
        
        const screenX = w / 2 + x * scale;
        // Physical y is height from ground, so we subtract from groundY
        const screenY = groundY - y * scale;
        
        return { sx: screenX, sy: screenY, scale: scale, groundY: groundY };
    }

    drawStadium() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Ground
        this.ctx.fillStyle = '#0f3d0f';
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.1, h * 0.4);
        this.ctx.lineTo(w * 0.9, h * 0.4);
        this.ctx.lineTo(w * 1.5, h);
        this.ctx.lineTo(-w * 0.5, h);
        this.ctx.fill();

        // Pitch
        this.ctx.fillStyle = '#b8a374';
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.45, h * 0.4);
        this.ctx.lineTo(w * 0.55, h * 0.4);
        this.ctx.lineTo(w * 0.65, h);
        this.ctx.lineTo(w * 0.35, h);
        this.ctx.fill();
        
        // Crease at z=100 (which is exactly h * 0.85)
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.38, h * 0.85);
        this.ctx.lineTo(w * 0.62, h * 0.85);
        this.ctx.stroke();

        // Sweet Spot Visual Marker at crease
        this.ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(w / 2, h * 0.85, 80, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawBall(ball) {
        if (!ball.active) return;

        // Draw Trail using actual 3D projections
        if (ball.trail && ball.trail.length > 0) {
            this.ctx.beginPath();
            let p0 = this.getProjected(ball.trail[0].x, ball.trail[0].y, ball.trail[0].z);
            this.ctx.moveTo(p0.sx, p0.sy);
            for(let i=1; i<ball.trail.length; i++) {
                let p = this.getProjected(ball.trail[i].x, ball.trail[i].y, ball.trail[i].z);
                this.ctx.lineTo(p.sx, p.sy);
            }
            let curr = this.getProjected(ball.x, ball.y, ball.z);
            this.ctx.lineTo(curr.sx, curr.sy);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }

        let curr = this.getProjected(ball.x, ball.y, ball.z);
        const size = Math.max(3, ball.radius * curr.scale);
        
        // Shadow (Drawn on the ground)
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(curr.sx, curr.groundY, size, size/3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Ball Body
        const grad = this.ctx.createRadialGradient(curr.sx - size/3, curr.sy - size/3, size/10, curr.sx, curr.sy, size);
        grad.addColorStop(0, '#ff6b6b');
        grad.addColorStop(1, '#8b0000');
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(curr.sx, curr.sy, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Seam
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = size/8;
        this.ctx.beginPath();
        this.ctx.arc(curr.sx, curr.sy, size*0.9, -Math.PI/4, Math.PI/4);
        this.ctx.stroke();
    }

    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawBat(isSwinging, hitTiming) {
        // Draw bat near the crease
        const x = this.canvas.width / 2;
        const y = this.canvas.height * 0.82; // slightly above crease line
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        let angle = isSwinging ? -70 : 25;
        this.ctx.rotate(angle * Math.PI / 180);
        
        if (isSwinging) {
            this.ctx.shadowBlur = 40;
            if (hitTiming === 'PERFECT') this.ctx.shadowColor = '#00ff00'; 
            else if (hitTiming === 'GOOD') this.ctx.shadowColor = '#00f2ff'; 
            else if (hitTiming === 'EARLY' || hitTiming === 'LATE') this.ctx.shadowColor = '#ffa500'; 
            else if (hitTiming === 'EDGED') this.ctx.shadowColor = '#ff0000'; 
            else this.ctx.shadowColor = 'rgba(255,255,255,0.5)';
        }

        // Handle
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(-6, -70, 12, 50);
        
        // Grip wrap
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        for(let i=-65; i<-25; i+=5) {
            this.ctx.beginPath();
            this.ctx.moveTo(-6, i);
            this.ctx.lineTo(6, i+2);
            this.ctx.stroke();
        }
        
        // Blade
        const bladeGrad = this.ctx.createLinearGradient(-18, -20, 18, -20);
        bladeGrad.addColorStop(0, '#cda776');
        bladeGrad.addColorStop(0.5, '#e8cfad');
        bladeGrad.addColorStop(1, '#cda776');
        
        this.ctx.fillStyle = bladeGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(-18, -20, 36, 100, 8);
        this.ctx.fill();
        
        // Bat Sticker
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(-10, 10, 20, 40);
        
        this.ctx.restore();
    }
}
