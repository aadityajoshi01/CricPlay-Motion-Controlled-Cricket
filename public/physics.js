export class Ball {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.trail = [];
    }

    reset() {
        // Simple, readable physical coordinates
        this.x = (Math.random() - 0.5) * 40; // Slight starting line variation
        this.y = 80; // Release height
        this.z = 0;  // 0 is bowler, 100 is batting crease
        
        // Extremely slow and relaxed speed to counter network latency
        this.vz = 0.8; 
        this.vx = 0; // Moves perfectly straight down the pitch
        this.vy = -0.8; // Constant downward slope to pitch
        
        this.radius = 8;
        this.isHit = false;
        this.active = true;
        this.hasBounced = false;
        this.trail = [];
    }

    update() {
        if (!this.active) return "inactive";

        this.trail.push({x: this.x, y: this.y, z: this.z});
        if (this.trail.length > 10) this.trail.shift();

        if (!this.isHit) {
            this.z += this.vz;
            this.x += this.vx;
            this.y += this.vy;

            // Simple consistent bounce at exactly z=70
            if (this.z >= 70 && !this.hasBounced) {
                this.hasBounced = true;
                this.y = 0;
                this.vy = 1.0; // simple upward bounce
            }

            // Passed batsman - we wait until Z=200 before killing the ball!
            // This gives the phone's swing event up to a full second of latency to arrive.
            if (this.z > 200) {
                this.active = false;
                return "missed";
            }
        } else {
            // Post-hit arcade physics
            this.x += this.vx;
            this.y += this.vy;
            this.z -= this.vz;

            // Simple visual gravity
            this.vy -= 0.1;

            if (this.y < 0 && this.vy < 0) {
                this.y = 0;
                this.vy = -this.vy * 0.5;
            }

            if (this.z < -200 || this.y > 500 || this.x < -300 || this.x > 300) {
                this.active = false;
                return "completed";
            }
        }
        return "moving";
    }

    checkSwingCollision(swingData) {
        if (this.isHit || !this.active) return null;

        // Distance: Negative = swung early (before Z=100), Positive = swung late OR network latency
        // Because the phone has latency, most swings will arrive when Z > 100
        const distance = this.z - 100; 
        
        let timing = "MISS";
        
        // Massive arcade hitbox zone specifically shifted to handle latency
        // Allows swings from slightly early (Z=80) to way past the bat (Z=160)
        if (distance > -20 && distance <= 40) {
            timing = "PERFECT";
        } else if (distance > -35 && distance <= 60) {
            timing = "GOOD";
        } else if (distance > 60 && distance <= 80) {
            timing = "LATE";
        } else {
            return null; // completely missed the window
        }

        if (timing !== "MISS" && swingData && swingData.swing) {
            this.isHit = true;
            
            let power = Math.min(10, swingData.power);
            
            // Simple outward visual trajectory
            this.vz = power * 1.5; 
            this.vy = 2.0 + (power * 0.2); // Elevate ball
            this.vx = (Math.random() - 0.5) * 2; // Slight random visual spread
            
            return {
                timing: timing,
                power: power
            };
        }
        return null;
    }
}
