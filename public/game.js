const socket = io();

// --- DOM ELEMENTS ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const ballsEl = document.getElementById('balls');
const outsEl = document.getElementById('outs');
const shotAnnounce = document.getElementById('shot-announcement');
const commentaryEl = document.getElementById('commentary');
const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const connectionStatus = document.getElementById('connection-status');
const finalScoreEl = document.getElementById('final-score');

// --- ASSETS & CONFIG ---
const SFX = {
    hit: document.getElementById('sfx-hit'),
    out: document.getElementById('sfx-out'),
    swing: document.getElementById('sfx-swing'),
    crowd: document.getElementById('sfx-crowd')
};

const CONFIG = {
    perspective: 600,
    spawnDelay: 2000,
    maxWickets: 3,
    gravity: 0.1,
    lerpFactor: 0.15
};

// --- GAME STATE ---
const STATES = { MENU: 0, PLAYING: 1, WICKET: 2, GAMEOVER: 3 };
let gameState = {
    state: STATES.MENU,
    score: 0,
    balls: 0,
    wickets: 0,
    difficulty: 1.0,
    screenShake: 0,
    timeScale: 1.0,
    currentBall: null,
    particles: [],
    bat: { x: 0, y: 140, z: 120, rx: 0, rz: 0, w: 50, h: 200 },
    gyro: { alpha: 0, beta: 0, gamma: 0, intensity: 0 },
    smoothed: { x: 0, rx: 0, rz: 0 },
    isSwinging: false,
    swingProgress: 0
};

// --- INITIALIZATION ---
function init() {
    resize();
    window.addEventListener('resize', resize);
    btnStart.onclick = startGame;
    btnRestart.onclick = restartGame;
    
    // Test for keyboard
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.state === STATES.PLAYING) triggerSwing();
    });

    animate();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// --- SOCKETS ---
socket.on('connect', () => {
    connectionStatus.textContent = 'Server Connected. Waiting for phone...';
    connectionStatus.style.color = 'var(--warning)';
});

socket.on('swing-trigger', (data) => {
    gameState.gyro = data;
    if (gameState.state === STATES.MENU) {
        connectionStatus.textContent = 'Phone Connected! Ready to Play.';
        connectionStatus.style.color = 'var(--success)';
        btnStart.style.display = 'inline-block';
    }

    // Production Gesture Detection
    if (data.intensity > 450 && !gameState.isSwinging && gameState.state === STATES.PLAYING) {
        triggerSwing();
    }
});

// --- CORE GAME LOGIC ---
function startGame() {
    gameState.state = STATES.PLAYING;
    gameState.score = 0;
    gameState.balls = 0;
    gameState.wickets = 0;
    gameState.difficulty = 1.0;
    updateHUD();
    screenStart.classList.add('hidden');
    spawnBall();
}

function restartGame() {
    screenGameOver.classList.add('hidden');
    startGame();
}

function updateHUD() {
    scoreEl.textContent = gameState.score;
    ballsEl.textContent = gameState.balls;
    outsEl.textContent = `${gameState.wickets}/${CONFIG.maxWickets}`;
}

function triggerSwing() {
    gameState.isSwinging = true;
    gameState.swingProgress = 0;
    SFX.swing.currentTime = 0;
    SFX.swing.play();
    
    if (gameState.currentBall) {
        checkCollision(gameState.currentBall);
    }
}

function checkCollision(ball) {
    if (ball.isHit || ball.isDead) return;

    // 3D Distance check
    const dx = Math.abs(ball.x - gameState.bat.x);
    const dz = Math.abs(ball.z - gameState.bat.z);
    const dy = Math.abs(ball.y - (gameState.bat.y - 80));

    if (dz < 50 && dx < 70 && dy < 120) {
        handleHit(ball);
    }
}

function handleHit(ball) {
    ball.isHit = true;
    const force = Math.max(10, gameState.gyro.intensity * 0.04);
    
    // Timing calculation
    const timing = 1 - (Math.abs(ball.z - 120) / 100); // 1.0 = Perfect
    
    ball.vz = 20 + force * timing;
    ball.vx = (ball.x - gameState.bat.x) * 4 + (gameState.gyro.gamma * 0.5);
    ball.vy = -10 - force * 0.5;

    let score = 0;
    let label = '';
    
    if (timing > 0.8 && force > 20) {
        score = 6; label = 'MAXIMUM! 6';
        applyJuice(20, 0.2, 1500);
        showCommentary('What a magnificent strike!');
        SFX.crowd.play();
    } else if (timing > 0.6) {
        score = 4; label = 'CRACKING 4';
        applyJuice(10, 1.0, 0);
        showCommentary('Beautifully timed through the covers.');
    } else {
        score = 1; label = 'SINGLE';
        showCommentary('Pushed into the gap for one.');
    }

    gameState.score += score;
    updateHUD();
    announce(label, score >= 4 ? 'var(--primary)' : '#fff');
    SFX.hit.play();
    createParticles(project(ball.x, ball.y, ball.z), score >= 4 ? 'var(--primary)' : '#fff');
}

function applyJuice(shake, timeScale, duration) {
    gameState.screenShake = shake;
    if (timeScale < 1.0) {
        gameState.timeScale = timeScale;
        setTimeout(() => gameState.timeScale = 1.0, duration);
    }
}

function showCommentary(text) {
    commentaryEl.textContent = text;
    commentaryEl.classList.add('show');
    setTimeout(() => commentaryEl.classList.remove('show'), 2000);
}

// --- RENDER & ANIMATE ---
function animate() {
    const ts = gameState.timeScale;
    
    // Screen Shake
    let ox = 0, oy = 0;
    if (gameState.screenShake > 0) {
        ox = (Math.random() - 0.5) * gameState.screenShake;
        oy = (Math.random() - 0.5) * gameState.screenShake;
        gameState.screenShake *= 0.9;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(ox, oy);

    drawStadium();
    
    if (gameState.state === STATES.PLAYING || gameState.state === STATES.WICKET) {
        updateBat(ts);
        if (gameState.currentBall) {
            gameState.currentBall.update(ts);
            gameState.currentBall.draw();
            if (gameState.currentBall.isDead) {
                gameState.currentBall = null;
                if (gameState.state === STATES.PLAYING) {
                    setTimeout(spawnBall, CONFIG.spawnDelay);
                }
            }
        }
        drawParticles(ts);
        drawBat();
    }

    ctx.restore();
    requestAnimationFrame(animate);
}

function drawStadium() {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(1, '#1e293b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grass & Pitch
    const p1 = project(-1000, 200, 0);
    const p2 = project(1000, 200, 0);
    const p3 = project(800, 200, 2000);
    const p4 = project(-800, 200, 2000);

    // Ground
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.6);
    ctx.lineTo(canvas.width, canvas.height * 0.6);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = '#14532d'; // Dark grass
    ctx.fill();

    // Pitch
    const pp1 = project(-120, 200, 0);
    const pp2 = project(120, 200, 0);
    const pp3 = project(100, 200, 1500);
    const pp4 = project(-100, 200, 1500);
    ctx.beginPath();
    ctx.moveTo(pp1.x, pp1.y); ctx.lineTo(pp2.x, pp2.y);
    ctx.lineTo(pp3.x, pp3.y); ctx.lineTo(pp4.x, pp4.y);
    ctx.closePath();
    ctx.fillStyle = '#b39470';
    ctx.fill();
}

function updateBat(ts) {
    const lerp = CONFIG.lerpFactor;
    gameState.smoothed.x += (gameState.gyro.gamma * 2.0 - gameState.smoothed.x) * lerp;
    gameState.smoothed.rz += (gameState.gyro.gamma * 0.02 - gameState.smoothed.rz) * lerp;
    
    gameState.bat.x = gameState.smoothed.x;
    gameState.bat.rz = gameState.smoothed.rz;

    if (gameState.isSwinging) {
        gameState.swingProgress += 0.15 * ts;
        if (gameState.swingProgress >= 1) gameState.isSwinging = false;
    }
}

function drawBat() {
    const b = gameState.bat;
    const p = project(b.x, b.y, b.z);
    
    ctx.save();
    ctx.translate(p.x, p.y);
    
    let swingRot = gameState.isSwinging ? Math.sin(gameState.swingProgress * Math.PI) * -1.5 : 0;
    ctx.rotate(b.rz + swingRot);
    
    const w = b.w * p.scale;
    const h = b.h * p.scale;
    
    // Blade (Wooden Texture)
    ctx.fillStyle = '#d4a373';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-w/2, -h, w, h);
    
    // Grip
    ctx.fillStyle = '#111';
    ctx.fillRect(-w/3, -h - 60*p.scale, w/1.5, 60*p.scale);
    ctx.restore();
}

class Ball {
    constructor() {
        this.z = 1500;
        this.x = (Math.random() - 0.5) * 60;
        this.y = -80;
        this.vz = -20 - (gameState.difficulty * 2);
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 2;
        this.isHit = false;
        this.isDead = false;
        this.hasBounced = false;
    }

    update(ts) {
        if (!this.isHit) {
            this.z += this.vz * ts;
            this.x += this.vx * ts;
            this.y += this.vy * ts;
            this.vy += CONFIG.gravity * 20 * ts;

            if (this.y > 200 && !this.hasBounced) {
                this.vy = -6 * ts;
                this.hasBounced = true;
            }

            if (this.z < 50) {
                this.isDead = true;
                handleWicket();
            }
        } else {
            this.z += this.vz * ts;
            this.x += this.vx * ts;
            this.y += this.vy * ts;
            this.vy += CONFIG.gravity * 20 * ts;
            if (this.z > 2000 || this.y > 1000) this.isDead = true;
        }
    }

    draw() {
        const p = project(this.x, this.y, this.z);
        const r = 12 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI*2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'red';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function handleWicket() {
    gameState.wickets++;
    updateHUD();
    SFX.out.play();
    announce('OUT!', '#ef4444');
    showCommentary('Clean bowled! He missed that completely.');
    
    if (gameState.wickets >= CONFIG.maxWickets) {
        setTimeout(gameOver, 1500);
    }
}

function gameOver() {
    gameState.state = STATES.GAMEOVER;
    finalScoreEl.textContent = gameState.score;
    screenGameOver.classList.remove('hidden');
}

function spawnBall() {
    gameState.currentBall = new Ball();
    gameState.balls++;
    gameState.difficulty += 0.05;
    updateHUD();
}

function project(x, y, z) {
    const fov = CONFIG.perspective;
    const scale = fov / (fov + z);
    return {
        x: canvas.width / 2 + x * scale,
        y: canvas.height * 0.45 + y * scale,
        scale: scale
    };
}

function announce(text, color) {
    shotAnnounce.textContent = text;
    shotAnnounce.style.color = color;
    shotAnnounce.classList.add('show');
    setTimeout(() => shotAnnounce.classList.remove('show'), 1500);
}

function createParticles(p, color) {
    for (let i = 0; i < 30; i++) {
        gameState.particles.push({
            x: p.x, y: p.y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 1.0,
            color: color
        });
    }
}

function drawParticles(ts) {
    gameState.particles.forEach((p, i) => {
        p.x += p.vx * ts; p.y += p.vy * ts; p.life -= 0.02 * ts;
        if (p.life <= 0) gameState.particles.splice(i, 1);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Start
init();
