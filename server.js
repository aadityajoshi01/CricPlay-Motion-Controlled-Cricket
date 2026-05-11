const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

// Basic route to check server status
app.get('/status', (req, res) => {
    res.json({ status: 'running' });
});

// Simple health‑check endpoint for USB‑debug verification
app.get('/ping', (req, res) => {
    res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Forward motion data from controller to game
    socket.on('motion-data', (data) => {
        // Log occasionally so we don't spam the console too much
        if (Math.random() > 0.98) console.log('Receiving motion data from phone...');
        
        // Use io.emit to ensure everyone gets it
        io.emit('swing-trigger', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
const IP_ADDRESS = '0.0.0.0'; // Allow access from other devices on the network

server.listen(PORT, IP_ADDRESS, () => {
    console.log(`\n🏏 Cricket Motion Game Server Running!`);
    console.log(`--------------------------------------`);
    console.log(`💻 Game Page: http://localhost:${PORT}/game.html`);
    console.log(`📱 Controller: http://<YOUR_LOCAL_IP>:${PORT}/controller.html`);
    console.log(`--------------------------------------\n`);
});
