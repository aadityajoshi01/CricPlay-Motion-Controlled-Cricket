export class SwingDetector {
    constructor(onSwing) {
        this.onSwing = onSwing;
        this.cooldownReady = true;
        this.threshold = 400; // Strong intentional swings only
    }

    process(rotationRate) {
        if (!this.cooldownReady) return;

        let alpha = rotationRate.alpha || 0; 
        let beta = rotationRate.beta || 0;   
        let gamma = rotationRate.gamma || 0; 

        // Extremely simple magnitude check - no complex history or filters
        let magnitude = Math.sqrt(alpha*alpha + beta*beta + gamma*gamma);

        if (magnitude > this.threshold) {
            this.triggerSwing(magnitude);
        }
    }

    triggerSwing(magnitude) {
        this.cooldownReady = false;
        
        // Power scaling 1 to 10
        let power = Math.min(10, magnitude / 100); 

        // Fire swing event instantly
        this.onSwing({
            swing: true,
            power: power,
            timestamp: Date.now()
        });

        // 800ms cooldown to prevent spamming
        setTimeout(() => {
            this.cooldownReady = true;
        }, 800);
    }
}
