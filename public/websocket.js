const socket = io('http://localhost:5000');

let latestSwingData = null;

socket.on('connect', () => {
    document.getElementById('socket-status').innerText = 'Connected';
    document.getElementById('socket-status').style.color = '#00ff00';
});

socket.on('disconnect', () => {
    document.getElementById('socket-status').innerText = 'Disconnected';
    document.getElementById('socket-status').style.color = '#ff0000';
});

socket.on('swing_data', (data) => {
    latestSwingData = data;
    if (data) {
        document.getElementById('debug-speed').innerText = Math.round(data.velocity);
        document.getElementById('shot-type').innerText = data.shot_type || 'NONE';
        
        // Update power bar based on velocity
        const power = Math.min(100, data.velocity / 10);
        document.getElementById('power-bar').style.width = power + '%';
    }
});
