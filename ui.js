class AudioSystem {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            this.ctx = null;
        }
    }
    
    playHit() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    
    playCheer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
}

export class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.wicketsEl = document.getElementById('wickets');
        this.oversEl = document.getElementById('overs');
        this.gameMsgEl = document.getElementById('game-msg');
        this.subMsgEl = document.getElementById('sub-msg');
        this.powerBarEl = document.getElementById('power-bar');
        this.shotTypeEl = document.getElementById('shot-type');
        this.socketStatusEl = document.getElementById('socket-status');
        this.debugSpeedEl = document.getElementById('debug-speed');
        this.debugZEl = document.getElementById('debug-z');
        this.debugAngleEl = document.getElementById('debug-angle');
        this.debugTimingEl = document.getElementById('debug-timing');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        
        this.audio = new AudioSystem();
    }

    updateScore(score, wickets, balls) {
        this.scoreEl.innerText = score;
        this.wicketsEl.innerText = wickets;
        this.oversEl.innerText = Math.floor(balls / 6) + '.' + (balls % 6);
    }

    showGameMsg(main, sub) {
        this.gameMsgEl.innerText = main;
        this.subMsgEl.innerText = sub || '';
    }

    updateSwingUI(power, direction, timing) {
        this.powerBarEl.style.width = Math.min(100, power * 10) + '%';
        this.shotTypeEl.innerText = timing !== 'MISS' ? `${timing} - ${direction.toUpperCase()}` : 'MISSED';
        if (timing === 'PERFECT') this.shotTypeEl.style.color = '#00ff00';
        else if (timing === 'GOOD') this.shotTypeEl.style.color = '#00f2ff';
        else if (timing === 'EARLY' || timing === 'LATE') this.shotTypeEl.style.color = '#ffa500';
        else this.shotTypeEl.style.color = '#ff0000';
    }

    updateDebugInfo(z, power, direction, timing) {
        if (this.debugZEl) this.debugZEl.innerText = z ? z.toFixed(1) : '0';
        if (this.debugAngleEl) this.debugAngleEl.innerText = direction;
        if (this.debugTimingEl) this.debugTimingEl.innerText = timing;
    }

    setFirebaseStatus(connected) {
        this.socketStatusEl.innerText = connected ? 'Connected (FB)' : 'Disconnected';
        this.socketStatusEl.style.color = connected ? '#00ff00' : '#ff0000';
    }

    hideStartScreen() {
        this.startScreen.style.opacity = '0';
        if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume(); // Resume audio context on user interaction
        }
        setTimeout(() => {
            this.startScreen.style.display = 'none';
        }, 500);
    }

    playHitSound() {
        this.audio.playHit();
    }

    playCheerSound() {
        this.audio.playCheer();
    }
}
