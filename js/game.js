/**
 * Zen Garden Snake - Master Game Loop & Controller
 * Integrates Renderer, Snake Kinematics, Collectibles, Web Audio API, Fullscreen & Modes
 */

class ZenGame {
  constructor() {
    this.canvas = document.getElementById('sandCanvas');
    this.renderer = new ZenRenderer(this.canvas);
    this.audio = window.zenAudio;
    this.collectibles = new CollectibleManager();

    // Mode: 'classic' or 'zen'
    this.mode = 'classic';
    this.score = 1;
    this.highScore = parseInt(localStorage.getItem('zen_snake_high_score') || '1', 10);

    // Game state: 'playing', 'paused', 'gameover', 'admire'
    this.state = 'playing';

    // Golden Leaf Blessing (10s Power-Up state)
    this.goldenBuffTime = 0;

    // Cell & snake setup in 800x800 square arena
    this.cellSize = 38;
    const startX = 400;
    const startY = 480;
    this.snake = new ZenSnake(startX, startY, this.cellSize);

    // Initial collectibles
    this.initCollectibles();

    // Loop timing
    this.lastTime = performance.now();

    // UI Elements
    this.initUI();

    // Event Listeners
    this.initInput();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initCollectibles() {
    this.collectibles.reset();
    // Exactly a single pink flower appears at a time
    this.spawnNewItem('sakura');
  }

  spawnNewItem(specificType = 'sakura') {
    const margin = 70;
    const w = this.renderer.width;
    const h = this.renderer.height;

    let attempts = 0;
    let x, y, valid;

    do {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * (h - margin * 2);

      // Check distance from snake head
      const distHead = Math.hypot(x - this.snake.x, y - this.snake.y);
      valid = distHead > 110;

      // Check distance from other collectibles
      for (let item of this.collectibles.items) {
        if (Math.hypot(x - item.x, y - item.y) < 90) {
          valid = false;
        }
      }
      attempts++;
    } while (!valid && attempts < 40);

    this.collectibles.spawnItem(specificType, x, y);
  }

  initUI() {
    this.scoreEl = document.getElementById('score-display');
    this.highScoreEl = document.getElementById('highscore-display');
    this.modeBadge = document.getElementById('mode-badge');
    this.btnMode = document.getElementById('btn-mode');
    this.btnSound = document.getElementById('btn-sound');
    this.btnPause = document.getElementById('btn-pause');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnFullscreen = document.getElementById('btn-fullscreen');

    this.pauseModal = document.getElementById('pause-modal');
    this.btnResume = document.getElementById('btn-resume');
    this.btnPauseRestart = document.getElementById('btn-pause-restart');

    this.gameoverModal = document.getElementById('gameover-modal');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalBestEl = document.getElementById('final-best');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnAdmire = document.getElementById('btn-admire');
    this.btnExitAdmire = document.getElementById('btn-exit-admire');

    this.highScoreEl.textContent = this.highScore;

    // Golden Blessing HUD elements
    this.buffBadgeEl = document.getElementById('buff-badge');
    this.buffTimerEl = document.getElementById('buff-timer');

    // Handle Fullscreen state change events (supports F key, button, Esc)
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const container = document.getElementById('game-container');
      const fsIcon = document.getElementById('fs-icon');
      const fsText = document.getElementById('fs-text');
      if (isFs) {
        container.classList.add('fullscreen-active');
        this.renderer.resize(true);
        if (fsIcon) fsIcon.textContent = '⤢';
        if (fsText) fsText.textContent = 'Exit';
      } else {
        container.classList.remove('fullscreen-active');
        this.renderer.resize(false);
        if (fsIcon) fsIcon.textContent = '⛶';
        if (fsText) fsText.textContent = 'Full';
      }
    };

    ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
      document.addEventListener(evt, handleFsChange);
    });

    // Button actions
    this.btnMode.addEventListener('click', () => this.toggleMode());
    this.btnSound.addEventListener('click', () => this.toggleSound());
    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnRestart.addEventListener('click', () => this.restartGame());
    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    this.btnResume.addEventListener('click', () => this.resumeGame());
    this.btnPauseRestart.addEventListener('click', () => this.restartGame());

    this.btnPlayAgain.addEventListener('click', () => this.restartGame());
    this.btnAdmire.addEventListener('click', () => this.enterAdmireMode());
    this.btnExitAdmire.addEventListener('click', () => this.exitAdmireMode());
  }

  activateGoldenBuff(duration = 5.0) {
    this.goldenBuffTime = duration;
    this.snake.isGoldenBuffActive = true;
    this.snake.speed = 225; // Speed boost
    this.audio.playGoldenChime();
    if (this.buffBadgeEl) {
      this.buffBadgeEl.classList.remove('hidden');
      if (this.buffTimerEl) {
        this.buffTimerEl.textContent = Math.ceil(duration) + 's';
      }
    }
  }

  toggleMode() {
    this.mode = this.mode === 'classic' ? 'zen' : 'classic';
    if (this.mode === 'zen') {
      this.modeBadge.textContent = 'Zen Mode';
      this.modeBadge.classList.add('zen');
      this.btnMode.querySelector('.btn-text').textContent = 'Switch to Classic';
    } else {
      this.modeBadge.textContent = 'Classic';
      this.modeBadge.classList.remove('zen');
      this.btnMode.querySelector('.btn-text').textContent = 'Switch to Zen';
    }
  }

  toggleSound() {
    const isMuted = this.audio.toggleMute();
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    if (isMuted) {
      soundIcon.textContent = '🔇';
      soundText.textContent = 'Muted';
    } else {
      soundIcon.textContent = '🔊';
      soundText.textContent = 'Sound';
      this.audio.playWoodClick();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.pauseModal.classList.remove('hidden');
      this.audio.playSingingBowl();
    } else if (this.state === 'paused') {
      this.resumeGame();
    }
  }

  resumeGame() {
    this.state = 'playing';
    this.pauseModal.classList.add('hidden');
    this.lastTime = performance.now();
  }

  restartGame() {
    this.state = 'playing';
    this.score = 1;
    this.scoreEl.textContent = this.score;

    // Reset Golden Blessing state
    this.goldenBuffTime = 0;
    this.snake.isGoldenBuffActive = false;
    this.snake.speed = 175;
    if (this.buffBadgeEl) {
      this.buffBadgeEl.classList.add('hidden');
    }

    this.pauseModal.classList.add('hidden');
    this.gameoverModal.classList.add('hidden');
    this.btnExitAdmire.classList.add('hidden');

    this.renderer.clearTrench();
    const startX = this.renderer.width / 2;
    const startY = this.renderer.height * 0.6;
    this.snake.reset(startX, startY);
    this.initCollectibles();
    this.audio.resetScale();
    this.audio.playWoodClick();

    this.lastTime = performance.now();
  }

  toggleFullscreen() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);

    if (!isFs) {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        rfs.call(el).catch(err => {
          console.warn('Fullscreen error:', err);
        });
      }
    } else {
      const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (efs) {
        efs.call(document).catch(err => {
          console.warn('Exit fullscreen error:', err);
        });
      }
    }
  }

  enterAdmireMode() {
    this.state = 'admire';
    this.gameoverModal.classList.add('hidden');
    document.getElementById('hud').style.opacity = '0';
    document.getElementById('hud-footer').style.opacity = '0';
    this.btnExitAdmire.classList.remove('hidden');
  }

  exitAdmireMode() {
    document.getElementById('hud').style.opacity = '1';
    document.getElementById('hud-footer').style.opacity = '0.65';
    this.btnExitAdmire.classList.add('hidden');
    this.restartGame();
  }

  gameOver() {
    if (this.mode === 'zen') return; // Zen mode has no death
    if (this.state === 'gameover' || this.state === 'shattering') return;

    this.state = 'shattering';
    this.audio.playSingingBowl();
    this.snake.shatter();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('zen_snake_high_score', this.highScore.toString());
      this.highScoreEl.textContent = this.highScore;
    }

    this.finalScoreEl.textContent = this.score;
    this.finalBestEl.textContent = this.highScore;

    // Graceful delay for kintsugi stone shards to scatter across the sand (matches Image 1)
    setTimeout(() => {
      if (this.state === 'shattering') {
        this.state = 'gameover';
        this.gameoverModal.classList.remove('hidden');
      }
    }, 1300);
  }

  initInput() {
    // Keyboard listener
    window.addEventListener('keydown', (e) => {
      // First interaction initializes audio context
      this.audio.init();

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.snake.setDirection(0, -1)) this.audio.playWoodClick();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.snake.setDirection(0, 1)) this.audio.playWoodClick();
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.snake.setDirection(-1, 0)) this.audio.playWoodClick();
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.snake.setDirection(1, 0)) this.audio.playWoodClick();
          e.preventDefault();
          break;
        case ' ':
          this.togglePause();
          e.preventDefault();
          break;
        case 'r':
        case 'R':
          this.restartGame();
          e.preventDefault();
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          e.preventDefault();
          break;
      }
    });

    // Mobile D-Pad Touch & Pointer Listeners
    const bindDpad = (btnId, dx, dy) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      const handlePress = (e) => {
        this.audio.init();
        if (this.snake.setDirection(dx, dy)) {
          this.audio.playWoodClick();
        }
        if (e.cancelable) e.preventDefault();
      };
      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('pointerdown', handlePress);
    };

    bindDpad('dpad-up', 0, -1);
    bindDpad('dpad-down', 0, 1);
    bindDpad('dpad-left', -1, 0);
    bindDpad('dpad-right', 1, 0);

    // Touch Swipe handling on garden frame & screen
    let touchStartX = 0;
    let touchStartY = 0;

    const touchTarget = document.getElementById('garden-stage') || window;

    touchTarget.addEventListener('touchstart', (e) => {
      this.audio.init();
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    touchTarget.addEventListener('touchmove', (e) => {
      // Prevent browser bounce / scroll while swiping inside game
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    touchTarget.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 16) {
        if (absDx > absDy) {
          if (dx > 0) {
            if (this.snake.setDirection(1, 0)) this.audio.playWoodClick();
          } else {
            if (this.snake.setDirection(-1, 0)) this.audio.playWoodClick();
          }
        } else {
          if (dy > 0) {
            if (this.snake.setDirection(0, 1)) this.audio.playWoodClick();
          } else {
            if (this.snake.setDirection(0, -1)) this.audio.playWoodClick();
          }
        }
      }
    }, { passive: true });
  }

  /**
   * Main game loop (60 / 120 FPS high performance)
   */
  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'playing') {
      // 0. Update Golden Blessing (simple and short countdown)
      if (this.goldenBuffTime > 0) {
        this.goldenBuffTime = Math.max(0, this.goldenBuffTime - dt);
        if (this.buffTimerEl) {
          this.buffTimerEl.textContent = Math.ceil(this.goldenBuffTime) + 's';
        }
        if (this.goldenBuffTime <= 0) {
          // Buff expired
          this.snake.isGoldenBuffActive = false;
          this.snake.speed = 175;
          if (this.buffBadgeEl) {
            this.buffBadgeEl.classList.add('hidden');
          }
        }
      }

      // 1. Update Snake & carve real-time sand trench (52px width matching scaled snake)
      this.snake.update(dt, this.renderer, (x1, y1, x2, y2) => {
        this.renderer.carveTrenchSegment(x1, y1, x2, y2, 52);
      });

      // 2. Check Border Bounds & Immunity/Zen Deflection
      const w = this.renderer.width;
      const h = this.renderer.height;
      const margin = 26;

      if (this.mode === 'zen' || this.goldenBuffTime > 0) {
        // Continuous organic deflection away from walls (NEVER teleports, preserving smooth continuous lacquer body)
        if (this.snake.x <= margin && this.snake.dir.x < 0) {
          const turnY = this.snake.y > h / 2 ? -1 : 1;
          this.snake.forceTurn(0, turnY);
          this.snake.x = margin;
        } else if (this.snake.x >= w - margin && this.snake.dir.x > 0) {
          const turnY = this.snake.y > h / 2 ? -1 : 1;
          this.snake.forceTurn(0, turnY);
          this.snake.x = w - margin;
        } else if (this.snake.y <= margin && this.snake.dir.y < 0) {
          const turnX = this.snake.x > w / 2 ? -1 : 1;
          this.snake.forceTurn(turnX, 0);
          this.snake.y = margin;
        } else if (this.snake.y >= h - margin && this.snake.dir.y > 0) {
          const turnX = this.snake.x > w / 2 ? -1 : 1;
          this.snake.forceTurn(turnX, 0);
          this.snake.y = h - margin;
        }
      } else {
        // Classic mode without immunity buff:
        // Border collision causes game over
        if (this.snake.x < margin || this.snake.x > w - margin ||
            this.snake.y < margin || this.snake.y > h - margin) {
          this.gameOver();
        }

        // Self-collision causes game over
        if (this.snake.checkSelfCollision()) {
          this.gameOver();
        }
      }

      // 3. Check Collectibles Collision
      for (let i = this.collectibles.items.length - 1; i >= 0; i--) {
        const item = this.collectibles.items[i];
        const dist = Math.hypot(this.snake.x - item.x, this.snake.y - item.y);
        if (dist < 34) {
          if (item.type === 'ginkgo') {
            // Golden Leaf: triggers simple, short 5s blessing (+speed, immunity, 2x flower growth)
            this.activateGoldenBuff(5.0);
            this.collectibles.createCollectBurst(item.x, item.y, 'ginkgo');
            this.snake.grow(1);
            this.score++;
            this.scoreEl.textContent = this.score;

            // Remove collected golden leaf (do not immediately replenish to keep it rare)
            this.collectibles.items.splice(i, 1);
          } else {
            // Sakura flower: play single acoustic piano note
            this.audio.playPianoNote();
            this.collectibles.createCollectBurst(item.x, item.y, 'sakura');
            // If golden blessing is active, double length & score!
            const growthAmt = this.goldenBuffTime > 0 ? 2 : 1;
            this.snake.grow(growthAmt);
            this.score += growthAmt;
            this.scoreEl.textContent = this.score;

            // Remove collected flower
            this.collectibles.items.splice(i, 1);
            // Always replenish normal Sakura flowers (keeping 3 flowers active in the garden)
            this.spawnNewItem('sakura');

            // Rare chance (12%) to spawn at most 1 Golden Ginkgo Leaf if none is currently present
            const hasGinkgo = this.collectibles.items.some(it => it.type === 'ginkgo');
            if (!hasGinkgo && this.goldenBuffTime <= 0 && Math.random() < 0.12) {
              this.spawnNewItem('ginkgo');
            }
          }

          if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreEl.textContent = this.highScore;
            localStorage.setItem('zen_snake_high_score', this.highScore.toString());
          }
        }
      }

      // 4. Update Collectibles & Particles
      this.collectibles.update(dt);
    } else if (this.state === 'shattering') {
      // Update scattering kintsugi fragments during death animation
      this.snake.update(dt, this.renderer, null);
      this.collectibles.update(dt);
    }

    // Render Frame
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    const ctx = this.renderer.ctx;

    // 1. Render Sand Base, Dynamic Trenches, and Dappled Shadows
    this.renderer.beginFrame();

    // 2. Render Collectibles (Sakura & Ginkgo Ensō) and Particles
    this.collectibles.draw(ctx);

    // 3. Render Creature (Living continuous body or shattered kintsugi stone fragments)
    this.snake.draw(ctx);
  }
}

// Launch on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new ZenGame();
});
