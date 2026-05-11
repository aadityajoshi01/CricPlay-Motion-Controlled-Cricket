const socket = io();

const statusEl = document.getElementById('status');
const alphaEl = document.getElementById('alpha');
const betaEl = document.getElementById('beta');
const gammaEl = document.getElementById('gamma');
const intensityEl = document.getElementById('intensity');
const permissionBtn = document.getElementById('permission-btn');
const sensitivityInput = document.getElementById('sensitivity');
const swingFeedback = document.getElementById('swing-feedback');
const logEl = document.getElementById('sensor-log');

const testBtn = document.getElementById('test-btn');

let isEnabled = false;
let lastSwingSent = 0;
const SWING_COOLDOWN = 600;

function log(msg, color = '#8b949e') {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    logEl.innerHTML = `<span style="color:${color}">[${time}] ${msg}</span><br>` + logEl.innerHTML;
    console.log(`[LOG] ${msg}`);
}

// Manual Test Button
testBtn.addEventListener('click', () => {
    log('Sending manual test swing...', '#00d2ff');
    socket.emit('motion-data', {
        alpha: 0, beta: 500, gamma: 500, 
        intensity: 1000,
        timestamp: Date.now()
    });
    triggerLocalFeedback();
});

// Socket Status
socket.on('connect', () => {
    statusEl.textContent = 'Connected';
    statusEl.className = 'status-badge status-connected';
    log('Connected to Server', '#3fb950');
});

socket.on('connect_error', (err) => {
    log(`Conn Error: ${err.message}`, '#f43f5e');
});

socket.on('disconnect', () => {
    statusEl.textContent = 'Disconnected';
    statusEl.className = 'status-badge status-disconnected';
    log('Disconnected from Server', '#f43f5e');
});

// Permission Handling
permissionBtn.addEventListener('click', async () => {
    log('Requesting permission...');
    
    if (typeof DeviceMotionEvent === 'undefined') {
        log('DeviceMotionEvent NOT supported by this browser', '#f43f5e');
        return;
    }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            log(`iOS Permission: ${permission}`);
            if (permission === 'granted') {
                startMotionDetection();
            }
        } catch (error) {
            log(`Permission Error: ${error.message}`, '#f43f5e');
        }
    } else {
        log('Android/Generic detected');
        startMotionDetection();
    }
});

function startMotionDetection() {
    isEnabled = true;
    permissionBtn.style.display = 'none';
    log('Detection Started', '#3fb950');
    
    window.addEventListener('devicemotion', (event) => {
        let alpha = 0, beta = 0, gamma = 0, intensity = 0;

        // Try Gyroscope first
        if (event.rotationRate && event.rotationRate.alpha !== null) {
            alpha = event.rotationRate.alpha;
            beta = event.rotationRate.beta;
            gamma = event.rotationRate.gamma;
            intensity = Math.sqrt(beta*beta + gamma*gamma);
        } 
        // Fallback to Accelerometer if Gyro is missing/null
        else if (event.accelerationIncludingGravity) {
            alpha = event.accelerationIncludingGravity.x || 0;
            beta = event.accelerationIncludingGravity.y || 0;
            gamma = event.accelerationIncludingGravity.z || 0;
            intensity = Math.abs(alpha) + Math.abs(beta) + Math.abs(gamma);
            
            // Only log once about fallback
            if (!window.usingFallback) {
                log('Using Accelerometer (No Gyro)', '#d29922');
                window.usingFallback = true;
            }
        } else {
            return; // No data available
        }
        
        // Update Debug UI
        alphaEl.textContent = alpha.toFixed(1);
        betaEl.textContent = beta.toFixed(1);
        gammaEl.textContent = gamma.toFixed(1);
        intensityEl.textContent = Math.round(intensity);

        const sensitivity = parseInt(sensitivityInput.value);

        // Send data
        socket.emit('motion-data', {
            alpha, beta, gamma, 
            intensity: intensity,
            timestamp: Date.now()
        });

        if (intensity > sensitivity && Date.now() - lastSwingSent > SWING_COOLDOWN) {
            triggerLocalFeedback();
            lastSwingSent = Date.now();
        }
    });

    // Check if event actually fires after 1 second
    setTimeout(() => {
        if (alphaEl.textContent === '0.0' && betaEl.textContent === '0.0') {
            log('WARNING: Events not firing. check HTTPS/Flags', '#f43f5e');
        }
    }, 1000);
}

function triggerLocalFeedback() {
    swingFeedback.style.display = 'block';
    setTimeout(() => { swingFeedback.style.display = 'none'; }, 500);
    if (navigator.vibrate) navigator.vibrate(50);
}
