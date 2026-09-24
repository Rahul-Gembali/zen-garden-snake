# 枯山水 蛇 — Zen Garden Snake

> A meditative, procedurally rendered Japanese Zen Garden Snake game built with vanilla HTML5 Canvas 2D and the Web Audio API. Inspired by traditional dry landscape (*karesansui*) aesthetics, Kintsugi golden joinery, and Urushi black lacquerware.

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://Rahul-Gembali.github.io/zen-garden-snake/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌸 Live Demonstration

Play directly in your browser:  
👉 **[https://Rahul-Gembali.github.io/zen-garden-snake/](https://Rahul-Gembali.github.io/zen-garden-snake/)**

---

## 🍵 Features & Aesthetics

### 1. Visual & Procedural Art
- **Procedural Raked Sand Waves (*Samon*)**: Canvas 2D generated continuous horizontal sand ridges with organic microscopic grain noise.
- **Real-Time Pressed Trench Carving**: As the creature glides, its weight carves permanent recessed, smoothed sand trenches with delicate 3D bevel rims.
- **Urushi Black Lacquer Anatomy**: Continuous 3D cylindrical body rendered along spine history with longitudinal light sheens, side rib notches, bulbous dome head with golden eyes and vertical nose-stem line, and graduated tail beads.
- **Kintsugi Gold Vine**: Meandering dorsal golden vine sprouting organic branchlets and leaf curls along the creature's back.
- **Dappled Tree Branch Shadows**: Soft Gaussian-blurred maple/bamboo shadows gently cast across the garden.
- **Kintsugi Shatter Death Effect**: Colliding with walls in Classic Mode shatters the creature into 35+ polygonal obsidian rock shards with gold leaf fractures and golden dust particles.

### 2. Balanced Gameplay
- **Single Sakura Blossom**: In keeping with Zen minimalism, exactly one pink Sakura blossom appears at a time with subtle concentric ripple waves.
- **Rare Golden Leaf Blessing**: Gathering Sakura flowers gives a rare 12% chance for a single Golden Ginkgo Leaf to sprout. Eating it bestows a 5-second blessing:
  - **Speed Boost**: +28% swift glide.
  - **Immunity**: Complete wall and tail collision protection with organic deflection.
  - **2x Growth**: Sakura flowers eaten during the countdown grant double length and score.
  - **Zen Countdown Pill**: Clean integer countdown (`✦ 5s` → `✦ 1s`).
- **Seamless Border Navigation**: Continuous $90^\circ$ organic deflection in Zen Mode and during immunity — never teleports, preventing coordinate artifacts or color inversions.
- **Modes**:
  - **Classic Mode**: Wall and self-collision active with high score tracking.
  - **Zen Mode**: Endless peaceful contemplation with organic wall glides and no death.
- **Admire Mode**: Pause upon defeat to contemplate the complete sand garden pattern carved by your journey.

### 3. Acoustic Procedural Audio (Web Audio API)
- **Acoustic Piano**: Procedurally synthesized string partials and hammer transients tuned to the Japanese Insen / Pentatonic scale (`C4, D4, Eb4, G4, Ab4, C5...`).
- **Ascending Arpeggio Chime**: Shimmering bell tone on collecting the Golden Ginkgo Leaf.
- **Bronze Singing Bowl (*Rin*)**: Resonant $216\text{ Hz}$ harmonic strike upon pause and game over.
- **Wooden Clack (*Hyōshigi*)**: Subtle acoustic click on direction changes.

### 4. Responsive & Edge-to-Edge Fullscreen
- **Strict 1:1 Aspect Ratio**: Automatically framed on desktop and tablets with tatami wood borders.
- **True Fullscreen (<kbd>F</kbd>)**: Borderless $100\text{vw} \times 100\text{vh}$ edge-to-edge canvas with floating translucent HUD.
- **Mobile Touch**: Full swipe detection and on-screen translucent rice-paper D-Pad for mobile devices.

---

## 🎮 Controls

| Action | Desktop Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Steer** | <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Swipe or On-screen D-Pad |
| **Pause / Resume** | <kbd>Space</kbd> or Pause button | Tap Pause button |
| **Fullscreen** | <kbd>F</kbd> | Tap Full button |
| **Restart Garden** | <kbd>R</kbd> | Tap Restart button |
| **Toggle Zen / Classic** | Mode button | Tap Mode button |

---

## 🛠️ Technology Stack

- **HTML5 Canvas 2D API**: High-DPI offscreen rendering, path kinematics, dynamic composite blending.
- **Web Audio API**: Synthetic physical modeling (decay envelopes, harmonic partials, biquad filters).
- **Vanilla CSS3**: Viewport-relative units (`100dvh`), glassmorphic rice-paper HUD, CSS transforms.
- **Zero External Dependencies**: Pure, lightweight, instantaneous loading.

---

## 📄 License

MIT License. Designed and created with tranquility.
