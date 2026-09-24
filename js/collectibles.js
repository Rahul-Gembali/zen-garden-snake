/**
 * Zen Garden Snake - Collectibles & Particle Effects
 * 1. Sakura (Pink Cherry Blossom) with subtle concentric sand ripples
 * 2. Golden Ginkgo Leaf with Japanese Ensō calligraphy brushstroke circle
 * 3. Kintsugi gold dust & petal burst particle system
 */

class CollectibleManager {
  constructor() {
    this.items = []; // Active collectibles on screen
    this.particles = []; // Floating gold dust & petal sparks
    this.time = 0;
  }

  reset() {
    this.items = [];
    this.particles = [];
  }

  /**
   * Spawns a collectible item avoiding the snake's body
   */
  spawnItem(type, x, y) {
    this.items.push({
      type: type, // 'sakura' or 'ginkgo'
      x: x,
      y: y,
      spawnTime: performance.now(),
      pulsePhase: Math.random() * Math.PI * 2,
      scale: 0.1, // pop-in animation scale
      targetScale: 1.0,
      collected: false
    });
  }

  /**
   * Creates a burst of gold leaf sparks and floral petals upon collection
   */
  createCollectBurst(x, y, type) {
    const count = type === 'sakura' ? 16 : 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.2 + Math.random() * 2.8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.02,
        size: 2.5 + Math.random() * 3.5,
        color: type === 'sakura'
          ? (Math.random() > 0.4 ? '#f49ab4' : '#eec45c')
          : (Math.random() > 0.3 ? '#f1c243' : '#d49b29'),
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15
      });
    }
  }

  update(dt) {
    this.time += dt * 0.002;

    // Update item animations
    for (let item of this.items) {
      if (item.scale < item.targetScale) {
        item.scale += (item.targetScale - item.scale) * 0.18;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // 1. Draw Collectibles
    for (let item of this.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(item.scale, item.scale);

      if (item.type === 'sakura') {
        this.drawSakura(ctx, item);
      } else if (item.type === 'ginkgo') {
        this.drawGinkgo(ctx, item);
      }

      ctx.restore();
    }

    // 2. Draw Floating Particles
    for (let p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;

      // Small diamond / polygon gold spark
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.7, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Render Sakura blossom with delicate concentric water ripple rings in sand
   */
  drawSakura(ctx, item) {
    const pulse = Math.sin(this.time * 2.5 + item.pulsePhase) * 1.5;

    // 1. Concentric Sand Ripple Rings
    // Exactly matches the delicate ripple circles around the flower in the screenshots
    const rippleRadii = [28 + pulse, 38 + pulse * 0.8, 48 + pulse * 0.6];
    rippleRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 162, 142, ${0.45 - idx * 0.12})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Outer light highlight ring
      ctx.beginPath();
      ctx.arc(0, 0, r + 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 - idx * 0.1})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    });

    // 2. Sakura Blossom (5 heart-shaped petals)
    const petalCount = 5;
    const petalRadius = 15;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i * Math.PI * 2) / petalCount - Math.PI / 2;
      ctx.save();
      ctx.rotate(angle);

      // Petal Gradient
      const grad = ctx.createRadialGradient(0, petalRadius * 0.6, 2, 0, petalRadius * 0.6, petalRadius);
      grad.addColorStop(0, '#f9c5d1');
      grad.addColorStop(0.7, '#f4a5ba');
      grad.addColorStop(1, '#ea86a3');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Soft heart/notched petal curve
      ctx.bezierCurveTo(-petalRadius * 0.6, petalRadius * 0.5, -petalRadius * 0.7, petalRadius * 1.1, -petalRadius * 0.2, petalRadius * 1.25);
      ctx.quadraticCurveTo(0, petalRadius * 1.15, petalRadius * 0.2, petalRadius * 1.25);
      ctx.bezierCurveTo(petalRadius * 0.7, petalRadius * 1.1, petalRadius * 0.6, petalRadius * 0.5, 0, 0);
      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate petal center vein
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, petalRadius * 0.8);
      ctx.strokeStyle = 'rgba(215, 95, 125, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Flower Center / Stamen
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
    centerGrad.addColorStop(0, '#d84b72');
    centerGrad.addColorStop(0.7, '#ba3056');
    centerGrad.addColorStop(1, '#8f1c3a');

    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    // Golden pollen anthers
    for (let a = 0; a < 6; a++) {
      const aAng = (a * Math.PI * 2) / 6;
      const ax = Math.cos(aAng) * 4.2;
      const ay = Math.sin(aAng) * 4.2;
      ctx.beginPath();
      ctx.arc(ax, ay, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fce280';
      ctx.fill();
    }
  }

  /**
   * Render Golden Ginkgo Leaf (Circle removed per user specification)
   */
  drawGinkgo(ctx, item) {
    ctx.save();

    // Subtle soft golden aura underneath
    const glowGrad = ctx.createRadialGradient(0, -6, 2, 0, -6, 26);
    glowGrad.addColorStop(0, 'rgba(245, 205, 75, 0.35)');
    glowGrad.addColorStop(1, 'rgba(245, 205, 75, 0)');
    ctx.beginPath();
    ctx.arc(0, -6, 26, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(-2, 8, 0, 2);
    ctx.strokeStyle = '#9e6d1e';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Leaf Fan Body
    const leafGrad = ctx.createLinearGradient(0, 0, 0, -18);
    leafGrad.addColorStop(0, '#d99726');
    leafGrad.addColorStop(0.4, '#ebb53a');
    leafGrad.addColorStop(1, '#fbd95e');

    ctx.beginPath();
    ctx.moveTo(0, 2);
    // Left flare
    ctx.bezierCurveTo(-10, 0, -18, -8, -17, -18);
    // Wavy top edge with characteristic center notch
    ctx.bezierCurveTo(-10, -22, -4, -19, -1, -15);
    ctx.bezierCurveTo(2, -19, 8, -22, 17, -18);
    // Right flare back to base
    ctx.bezierCurveTo(18, -8, 10, 0, 0, 2);
    ctx.closePath();

    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Soft border stroke
    ctx.strokeStyle = '#c58316';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Delicate radial veins
    for (let v = -4; v <= 4; v++) {
      if (v === 0) continue;
      const vx = v * 3.4;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(vx * 0.4, -6, vx, -16);
      ctx.strokeStyle = 'rgba(180, 120, 25, 0.35)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.CollectibleManager = CollectibleManager;
