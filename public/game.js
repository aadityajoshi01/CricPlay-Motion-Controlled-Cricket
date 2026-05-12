import { listenToFirebaseSwings } from './firebase.js';
import { Renderer } from './renderer.js';
import { Ball } from './physics.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const ball = new Ball(window.innerWidth, window.innerHeight);
const ui = new UI();

let score = 0;
let wickets = 0;
let ballCount = 0;
let gameState = 'START'; 

let batSwingTimer = 0;
let lastHitTiming = null;
let timeScale = 1.0;
let pendingRuns = 0;

ui.startBtn.addEventListener('click', () => {
    ui.hideStartScreen();
    gameState = 'READY';
    nextBall();
});

listenToFirebaseSwings((swingData) => {
    handleSwingEvent(swingData);
}, (connected) => {
    ui.setFirebaseStatus(connected);
});

// Debug keyboard hook
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleSwingEvent({ swing: true, power: 8, timestamp: Date.now() });
    }
});

function handleSwingEvent(swingData) {
    batSwingTimer = 20; 
    
    if (gameState === 'BOWLING') {
        const hitResult = ball.checkSwingCollision(swingData);
        ui.updateDebugInfo(ball.z, swingData.power, "STRAIGHT", hitResult ? hitResult.timing : "MISS");
        
        if (hitResult) {
            handleHit(hitResult);
        } else {
            ui.updateSwingUI(swingData.power, "STRAIGHT", "MISS");
            if (ball.z > 60 && ball.z < 200) {
                ball.active = false;
                handleMiss();
            }
        }
    } else {
        ui.updateDebugInfo(0, swingData.power, "PRACTICE", "PRACTICE");
        ui.updateSwingUI(swingData.power, "STRAIGHT", "PRACTICE");
    }
}

function nextBall() {
    if (gameState === 'GAMEOVER') return;
    
    gameState = 'READY';
    timeScale = 1.0;
    ui.showGameMsg('READY...', 'Bowler is running in');
    
    setTimeout(() => {
        gameState = 'BOWLING';
        ball.reset();
        lastHitTiming = null;
        pendingRuns = 0;
        ui.showGameMsg('', '');
    }, 2000);
}

function calculateRuns(hitResult) {
    // Pure, consistent arcade scoring
    if (hitResult.timing === 'PERFECT') {
        return hitResult.power > 7 ? 6 : 4;
    } else if (hitResult.timing === 'GOOD') {
        return hitResult.power > 5 ? 2 : 1;
    } else if (hitResult.timing === 'LATE') {
        return 0; // Dot ball
    }
    return 0;
}

function handleHit(hitResult) {
    ui.playHitSound();
    ui.updateSwingUI(hitResult.power, "STRAIGHT", hitResult.timing);
    lastHitTiming = hitResult.timing;
    gameState = 'BALL_HIT';
    
    let result = calculateRuns(hitResult);
    pendingRuns = result;
    
    if (result === 6) {
        ui.playCheerSound();
        renderer.shakeScreen(30);
    } else if (result === 4) {
        ui.playCheerSound();
        renderer.shakeScreen(15);
    }
    
    ui.showGameMsg(`${result} RUNS!`, `Timing: ${hitResult.timing}`);
    renderer.addParticles(window.innerWidth / 2, window.innerHeight * 0.85, (hitResult.power || 5) * 10);
}

function handleMiss() {
    gameState = 'COMPLETED';
    wickets++;
    ui.showGameMsg('MISS!', 'Wicket down.');
    ballCount++;
    ui.updateScore(score, wickets, ballCount);
    
    if (wickets >= 10) {
        gameState = 'GAMEOVER';
        setTimeout(() => ui.showGameMsg('GAME OVER', `Final Score: ${score}`), 1000);
    } else {
        setTimeout(nextBall, 2000);
    }
}

function handleHitCompletion() {
    score += pendingRuns;
    ballCount++;
    ui.updateScore(score, wickets, ballCount);
    gameState = 'COMPLETED';
    setTimeout(nextBall, 2000);
}

function gameLoop() {
    renderer.clear();
    renderer.drawStadium();

    let isSwinging = batSwingTimer > 0;
    if (batSwingTimer > 0) batSwingTimer -= timeScale;

    if (gameState === 'BOWLING' || gameState === 'BALL_HIT' || gameState === 'COMPLETED') {
        
        let status = "moving";
        renderer.physicsAccumulator = (renderer.physicsAccumulator || 0) + timeScale;
        while (renderer.physicsAccumulator >= 1.0) {
            status = ball.update();
            renderer.physicsAccumulator -= 1.0;
        }
        
        if (gameState === 'BOWLING' && status === 'missed') {
            handleMiss(); // Let it pass the bat without swinging
        } else if (gameState === 'BALL_HIT' && status === 'completed') {
            handleHitCompletion();
        }
        
        renderer.drawBall(ball);
        renderer.drawParticles();
    }

    renderer.drawBat(isSwinging, lastHitTiming);
    renderer.endRender(); 

    requestAnimationFrame(gameLoop);
}

gameLoop();
