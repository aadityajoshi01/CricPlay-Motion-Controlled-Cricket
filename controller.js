import { db, ref, set, onValue } from './firebaseConfig.js';
import { SwingDetector } from './swingDetection.js';

const setupUi = document.getElementById('setup-ui');
const connectBtn = document.getElementById('connect-btn');
const controllerUi = document.getElementById('controller-ui');
const swingIndicator = document.getElementById('swing-indicator');
const httpsWarning = document.getElementById('https-warning');

// Debug elements
const motionDataEl = document.getElementById('motion-data');
const lastShotEl = document.getElementById('last-shot');
const fbInd = document.getElementById('fb-ind');
const sensorInd = document.getElementById('sensor-ind');
const pingEl = document.getElementById('ping');

let swingDetector = null;
let sensorActive = false;

// Check HTTPS
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    httpsWarning.style.display = 'block';
}

// Firebase connection status tracking
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        fbInd.classList.add('ind-green');
    } else {
        fbInd.classList.remove('ind-green');
    }
});

async function enableWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            await navigator.wakeLock.request('screen');
        } catch (err) {
            console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }
}

connectBtn.addEventListener('click', async () => {
    let permissionsGranted = true;

    // iOS 13+ requires explicit permission for DeviceMotion via a user gesture
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
                permissionsGranted = false;
                alert('DeviceMotion permission denied. Cannot use motion controls.');
            }
        } catch (e) {
            console.error('DeviceMotion permission error:', e);
            permissionsGranted = false;
            alert('Failed to request motion permissions. Ensure you are accessing via HTTPS (ngrok).');
        }
    }
    
    if (!permissionsGranted) return;

    // Attempt Fullscreen for immersion
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        }
    } catch(e) {
        console.warn("Fullscreen request failed", e);
    }

    enableWakeLock();

    // Setup UI switch
    setupUi.classList.add('hidden');
    controllerUi.classList.remove('hidden');

    swingDetector = new SwingDetector(handleSwing);

    window.addEventListener('devicemotion', (e) => {
        if (e.rotationRate && (e.rotationRate.alpha !== null || e.rotationRate.beta !== null || e.rotationRate.gamma !== null)) {
            if (!sensorActive) {
                sensorActive = true;
                sensorInd.classList.add('ind-green');
                sensorInd.classList.remove('ind-yellow');
            }
            
            motionDataEl.innerText = `A:${Math.round(e.rotationRate.alpha || 0)} B:${Math.round(e.rotationRate.beta || 0)} G:${Math.round(e.rotationRate.gamma || 0)}`;
            swingDetector.process(e.rotationRate);
        }
    });

    // Check if sensors are failing silently
    setTimeout(() => {
        if (!sensorActive) {
            sensorInd.classList.add('ind-yellow');
            alert("No sensor data received. Your browser is blocking sensors. Please access via the HTTPS ngrok URL.");
        }
    }, 2500);
});

function handleSwing(swingEvent) {
    const ts = Date.now();
    swingEvent.timestamp = ts; // Guarantee exact timestamp

    // Upload to Firebase and measure latency
    set(ref(db, 'controller/gyro/swing'), swingEvent).then(() => {
        const ping = Date.now() - ts;
        pingEl.innerText = `${ping}ms`;
    }).catch(e => console.error("Firebase sync error:", e));

    lastShotEl.innerText = `${swingEvent.direction.toUpperCase()}`;

    // Visual feedback
    swingIndicator.classList.add('active-swing');
    swingIndicator.innerText = "SWING!";
    
    // Haptic feedback (Android mainly)
    if (navigator.vibrate) navigator.vibrate([100]);

    setTimeout(() => {
        swingIndicator.classList.remove('active-swing');
        swingIndicator.innerText = "READY";
    }, 300);
}
