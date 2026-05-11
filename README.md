# 🏏 CricPlay: Motion-Controlled Cricket

A lightweight, browser-based cricket batting game where your phone acts as the motion-sensing bat.

## 🚀 Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open the Game**:
   Go to `http://localhost:3000/game.html` on your laptop.

4. **Connect your Phone**:
   - Find your computer's local IP address (e.g., `192.168.1.10`).
   - On your phone, go to `http://<YOUR_IP>:3000/controller.html`.
   - Ensure both devices are on the same Wi-Fi network.
   - Tap **"Enable Motion"** on your phone.

## 🎮 How to Play

1. Stand in a batting stance, holding your phone like a cricket bat handle.
2. Watch the ball come from the pitch.
3. **Swing your phone** when the ball is close (in the white crease area).
4. Timing is everything:
   - **Perfect Timing**: 6 Runs!
   - **Good Timing**: 4 Runs!
   - **Mistimed**: 1 Run or Edge.
   - **Miss**: Risks getting bowled (OUT).

## 🛠 Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, Vanilla CSS/JS
- **Motion**: DeviceMotionEvent (Gyroscope)

## 📋 Requirements
- A phone with a gyroscope (most modern smartphones).
- Modern browser (Chrome/Safari recommended).
- **HTTPS Note**: Modern browsers may require HTTPS or `localhost` for motion sensors. For local development on different devices, you might need to enable "Insecure origins treated as secure" in Chrome flags if using `http` on a local IP.
