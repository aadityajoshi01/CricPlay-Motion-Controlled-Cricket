# 🏏 CricPlay: Motion-Controlled Cricket (Arcade Edition)

A lightweight, purely browser-based arcade cricket batting game where your phone acts as the motion-sensing bat! Inspired by classic arcade games like Stick Cricket and Wii Sports.

This project now runs **100% securely over HTTPS via GitHub Pages and Firebase**, meaning absolutely zero local server setup is required to play!

## 🚀 Play Instantly (No Setup Required)

1. **Open the Game (Laptop/Desktop)**
   Go to: [https://aadityajoshi.dev/](https://aadityajoshi.dev/)

2. **Connect your Bat (Smartphone)**
   Go to: [https://aadityajoshi.dev/controller.html](https://aadityajoshi.dev/controller.html)
   *(Since this runs on GitHub Pages over secure HTTPS, iOS Safari and Android Chrome will properly allow access to your phone's motion sensors!)*

## 🎮 How to Play

1. Stand in a batting stance, holding your phone firmly like a cricket bat handle.
2. Watch the ball travel down the pitch on your laptop screen.
3. **Swing your phone!** The game uses highly tuned arcade-style timing windows:
   - **Perfect Timing:** Hits a clean Boundary (4 or 6 Runs).
   - **Good Timing:** Grounded shot for 1 or 2 Runs.
   - **Late Swing:** Defends the ball (0 Runs).
   - **Miss:** Miss the ball completely and you lose a wicket!

## 🛠 Tech Stack & Architecture

- **Frontend:** Pure HTML5 Canvas, Vanilla JS, CSS
- **Communication Layer:** Firebase Realtime Database
- **Hosting:** GitHub Pages
- **Sensors:** DeviceMotion and DeviceOrientation APIs

Because communication is handled remotely via Firebase, your phone and laptop **do not** need to be on the same Wi-Fi network. You can play anywhere!

## 💻 Developer Debug Mode

The game features a built-in Developer UI in the bottom right corner of the screen. When you swing the phone, it logs:
- **Ball Depth (Z):** How far down the pitch the ball was when the server registered your swing.
- **Swing Power:** The 1-10 magnitude score of your arm swing.
- **Timing Logic:** The exact calculation window the engine placed your hit into.
