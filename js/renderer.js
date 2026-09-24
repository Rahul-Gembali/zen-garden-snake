/**
 * Zen Garden Snake - Canvas 2D Master Renderer
 * Procedural Raked Sand Waves, Tree Branch Shadows, Dynamic Sand Trench Carving
 */

class ZenRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // Fixed 1:1 Square logical arena (800x800)
    this.width = 800;
    this.height = 800;

    // Offscreen Canvas for persistent sand trench carving
    this.trenchCanvas = document.createElement('canvas');
    this.trenchCtx = this.trenchCanvas.getContext('2d');

    // Pre-rendered background sand texture & wave layer
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');

    // Tree shadow offscreen layer
    this.shadowCanvas = document.createElement('canvas');
    this.shadowCtx = this.shadowCanvas.getContext('2d');

    // Sand parameters matching the reference images
    this.sandBaseColor = '#ece4d4';
    this.trenchColor = '#f3eeea';
    this.ridgeSpacing = 22; // distance between horizontal rake lines

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(isFullMode = false) {
    const isFullscreen = isFullMode || !!document.fullscreenElement;

    if (isFullscreen) {
      // True 100% borderless edge-to-edge monitor mode (no sidebars!)
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else {
      // 1:1 Square Arena dimensions
      this.width = 800;
      this.height = 800;
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5); // high crispness capped to prevent mobile GPU stall

    // Scale main canvas buffer for high-DPI crispness
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Resize offscreen trench canvas (preserve existing drawn trenches if any)
    const oldTrench = document.createElement('canvas');
    oldTrench.width = this.trenchCanvas.width;
    oldTrench.height = this.trenchCanvas.height;
    if (oldTrench.width > 0 && oldTrench.height > 0) {
      oldTrench.getContext('2d').drawImage(this.trenchCanvas, 0, 0);
    }

    this.trenchCanvas.width = Math.floor(this.width * this.dpr);
    this.trenchCanvas.height = Math.floor(this.height * this.dpr);
    this.trenchCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (oldTrench.width > 0 && oldTrench.height > 0) {
      this.trenchCtx.drawImage(oldTrench, 0, 0, oldTrench.width / this.dpr, oldTrench.height / this.dpr);
    }

    // Pre-render static background and shadows
    this.renderStaticBackground();
    this.renderTreeShadows();
  }

  /**
   * Pre-renders the Japanese raked sand canvas with realistic horizontal wave ridges
   * and organic grain texture
   */
  renderStaticBackground() {
    this.bgCanvas.width = Math.floor(this.width * this.dpr);
    this.bgCanvas.height = Math.floor(this.height * this.dpr);
    const ctx = this.bgCtx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Base Sand Fill with warm gradient
    const bgGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGrad.addColorStop(0, '#eee6d8');
    bgGrad.addColorStop(0.5, '#ece4d4');
    bgGrad.addColorStop(1, '#e6dcce');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Micro Sand Grain Noise
    const grainCanvas = document.createElement('canvas');
    const gSize = 180;
    grainCanvas.width = gSize;
    grainCanvas.height = gSize;
    const gCtx = grainCanvas.getContext('2d');
    const imgData = gCtx.createImageData(gSize, gSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      const baseVal = 236 + noise;
      imgData.data[i] = baseVal;
      imgData.data[i + 1] = baseVal - 6;
      imgData.data[i + 2] = baseVal - 14;
      imgData.data[i + 3] = Math.random() > 0.5 ? 40 : 15;
    }
    gCtx.putImageData(imgData, 0, 0);
    const grainPattern = ctx.createPattern(grainCanvas, 'repeat');
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Horizontal Wavy Raked Sand Ridges
    // As seen in the reference, these are parallel gentle sinusoidal ripples
    const step = this.ridgeSpacing;
    const rows = Math.ceil(this.height / step) + 2;

    for (let r = 0; r < rows; r++) {
      const baseY = r * step;

      // Calculate organic wave path
      const getWaveY = (x) => {
        return baseY +
          Math.sin(x * 0.0035 + r * 0.12) * 3.4 +
          Math.sin(x * 0.011 + r * 0.08) * 1.8 +
          Math.sin(x * 0.024) * 0.7;
      };

      // Crest Highlight (Top edge catches ambient light)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 252, 245, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let x = -20; x <= this.width + 20; x += 12) {
        const y = getWaveY(x);
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Trough Shadow (Bottom depression has soft ambient shadow)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(165, 148, 126, 0.42)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let x = -20; x <= this.width + 20; x += 12) {
        const y = getWaveY(x) + 2.2;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  /**
   * Pre-renders tranquil, dappled tree branch shadows across the top-right
   * Matches the reference images. Zero motion while moving to keep zen serenity.
   */
  renderTreeShadows() {
    this.shadowCanvas.width = Math.floor(this.width * this.dpr);
    this.shadowCanvas.height = Math.floor(this.height * this.dpr);
    const ctx = this.shadowCtx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const startX = this.width * 0.88;
    const startY = -40;

    ctx.save();
    // Soft blur for sun-dappled foliage shadow
    ctx.fillStyle = 'rgba(105, 95, 82, 0.16)';
    ctx.strokeStyle = 'rgba(105, 95, 82, 0.16)';
    ctx.lineCap = 'round';

    // Main Branch 1 (drifting into upper right quadrant)
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(this.width * 0.76, this.height * 0.14, this.width * 0.68, this.height * 0.22, this.width * 0.62, this.height * 0.38);
    ctx.lineWidth = 14;
    ctx.stroke();

    // Branch 2
    ctx.beginPath();
    ctx.moveTo(this.width * 0.94, startY + 20);
    ctx.bezierCurveTo(this.width * 0.82, this.height * 0.25, this.width * 0.74, this.height * 0.45, this.width * 0.72, this.height * 0.65);
    ctx.lineWidth = 9;
    ctx.stroke();

    // Secondary twigs
    const twigs = [
      { sx: this.width * 0.72, sy: this.height * 0.18, ex: this.width * 0.58, ey: this.height * 0.26, w: 6 },
      { sx: this.width * 0.65, sy: this.height * 0.32, ex: this.width * 0.52, ey: this.height * 0.34, w: 4 },
      { sx: this.width * 0.78, sy: this.height * 0.35, ex: this.width * 0.66, ey: this.height * 0.48, w: 5 },
      { sx: this.width * 0.82, sy: this.height * 0.12, ex: this.width * 0.89, ey: this.height * 0.28, w: 5 }
    ];
    twigs.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(t.sx, t.sy);
      ctx.quadraticCurveTo((t.sx + t.ex) / 2 + 10, (t.sy + t.ey) / 2 - 10, t.ex, t.ey);
      ctx.lineWidth = t.w;
      ctx.stroke();
    });

    // Clusters of Japanese maple / bamboo leaves
    const leafClusters = [
      { x: this.width * 0.62, y: this.height * 0.16, count: 18, radius: 45 },
      { x: this.width * 0.56, y: this.height * 0.28, count: 24, radius: 60 },
      { x: this.width * 0.66, y: this.height * 0.38, count: 20, radius: 55 },
      { x: this.width * 0.74, y: this.height * 0.22, count: 28, radius: 65 },
      { x: this.width * 0.73, y: this.height * 0.52, count: 22, radius: 50 },
      { x: this.width * 0.84, y: this.height * 0.30, count: 25, radius: 60 }
    ];

    leafClusters.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const ang = (i / cluster.count) * Math.PI * 2 + (Math.random() * 0.5);
        const dist = Math.random() * cluster.radius;
        const lx = cluster.x + Math.cos(ang) * dist;
        const ly = cluster.y + Math.sin(ang) * dist;
        const lAngle = Math.random() * Math.PI * 2;
        const lLength = 22 + Math.random() * 16;
        const lWidth = 8 + Math.random() * 6;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(lAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, lLength / 2, lWidth / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }

  /**
   * Resets and clears the carved sand trench canvas
   */
  clearTrench() {
    this.trenchCtx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Carves a segment of pressed sand track as the creature moves
   * Creates the signature smooth, lighter recessed path with 3D bevel edges
   */
  carveTrenchSegment(x1, y1, x2, y2, width = 52) {
    const ctx = this.trenchCtx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Subtle ambient inner shadow along the rim
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(155, 140, 120, 0.32)';
    ctx.lineWidth = width + 2;
    ctx.moveTo(x1 - 1, y1 - 1);
    ctx.lineTo(x2 - 1, y2 - 1);
    ctx.stroke();

    // 2. Delicate light catch rim
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = width + 2;
    ctx.moveTo(x1 + 1, y1 + 1);
    ctx.lineTo(x2 + 1, y2 + 1);
    ctx.stroke();

    // 3. Flat pressed sand base (solid opaque tone matching reference screenshot!)
    ctx.beginPath();
    ctx.strokeStyle = '#eae3d2';
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 4. Subtle inner smoothed bed (opaque tone, no transparent white accumulation!)
    ctx.beginPath();
    ctx.strokeStyle = '#f2ece0';
    ctx.lineWidth = width - 6;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Main render pass:
   * 1. Draw static raked sand background
   * 2. Blend the carved trenches over the sand
   * 3. Blend tree branch dappled shadows with soft blur
   */
  beginFrame() {
    // 1. Draw Raked Sand Waves
    this.ctx.drawImage(this.bgCanvas, 0, 0, this.width, this.height);

    // 2. Composite the Dynamic Pressed Sand Trenches
    this.ctx.drawImage(this.trenchCanvas, 0, 0, this.width, this.height);

    // 3. Composite the Tree Branch Dappled Shadows with soft blur filter
    this.ctx.save();
    this.ctx.filter = 'blur(12px)';
    this.ctx.drawImage(this.shadowCanvas, 0, 0, this.width, this.height);
    this.ctx.restore();
  }
}

window.ZenRenderer = ZenRenderer;
