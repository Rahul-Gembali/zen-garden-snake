/**
 * Zen Garden Snake - Creature Engine (Continuous Urushi Body & Kintsugi Kinesis)
 * 
 * 1. Living State: A continuous, sleek, 3D cylindrical Japanese lacquer (Urushi) body
 *    with bulbous dome head, golden eyes with nose-stem, side rib notches, and an organic
 *    golden Kintsugi vine with sprouting branchlets running down the dorsal spine,
 *    ending in a tapered beaded tail tip.
 * 2. Death State: Upon collision (Image 1), the body shatters into geometric obsidian
 *    fragments with gleaming gold leaf kintsugi borders that scatter into the sand.
 */

class ZenSnake {
  constructor(startX, startY, cellSize = 38) {
    this.cellSize = cellSize;
    this.bodyRadius = 18.0; // Scaled up for prominent, substantial visual presence
    this.speed = 175; // pixels per second

    // State: 'ALIVE', 'SHATTERING', 'SHATTERED'
    this.state = 'ALIVE';

    // Golden Leaf Blessing Active Flag
    this.isGoldenBuffActive = false;

    // Current position and motion
    this.x = startX;
    this.y = startY;
    this.dir = { x: 0, y: -1 }; // Initial moving upwards (matches Image 3)
    this.nextDir = { x: 0, y: -1 };
    this.angle = -Math.PI / 2;
    this.targetAngle = -Math.PI / 2;

    // Continuous Path History (dense points for smooth spine interpolation)
    this.pathHistory = [];
    this.maxHistoryLength = 3000;

    // Length of the snake in pixels
    this.pixelLength = 120; // initial starting length
    this.targetPixelLength = 120;

    // Direction input queue for responsive 90-degree cornering
    this.dirQueue = [];

    // Shattered kintsugi shards (for death state)
    this.shards = [];
    this.shardParticles = [];

    // Pre-seed path history straight down so snake starts with full body
    const seedPoints = 120;
    const step = 2.0;
    for (let i = 0; i < seedPoints; i++) {
      this.pathHistory.push({
        x: this.x,
        y: this.y + i * step,
        angle: -Math.PI / 2
      });
    }

    // Pre-calculate vine branchlet offsets for organic consistency
    this.branchlets = this.generateBranchlets(40);
  }

  reset(startX, startY) {
    this.state = 'ALIVE';
    this.isGoldenBuffActive = false;
    this.x = startX;
    this.y = startY;
    this.dir = { x: 0, y: -1 };
    this.nextDir = { x: 0, y: -1 };
    this.angle = -Math.PI / 2;
    this.targetAngle = -Math.PI / 2;
    this.pixelLength = 120;
    this.targetPixelLength = 120;
    this.dirQueue = [];
    this.shards = [];
    this.shardParticles = [];

    this.pathHistory = [];
    const seedPoints = 120;
    const step = 2.0;
    for (let i = 0; i < seedPoints; i++) {
      this.pathHistory.push({
        x: this.x,
        y: this.y + i * step,
        angle: -Math.PI / 2
      });
    }
  }

  setDirection(dx, dy) {
    if (this.state !== 'ALIVE') return false;

    const lastDir = this.dirQueue.length > 0 ? this.dirQueue[this.dirQueue.length - 1] : this.dir;
    // Disallow 180-degree reversal
    if (dx === -lastDir.x && dy === -lastDir.y) return false;
    // Disallow duplicate direction
    if (dx === lastDir.x && dy === lastDir.y) return false;

    if (this.dirQueue.length < 2) {
      this.dirQueue.push({ x: dx, y: dy });
      return true;
    }
    return false;
  }

  forceTurn(dx, dy) {
    if (this.state !== 'ALIVE') return;
    this.dir = { x: dx, y: dy };
    this.dirQueue = [];
    this.targetAngle = Math.atan2(dy, dx);
  }

  grow(amount = 1) {
    // Each flower increases body length by 50px
    this.targetPixelLength += amount * 52;
  }

  /**
   * Shatter snake into kintsugi obsidian stone fragments (Matches Image 1 death screen)
   */
  shatter(impactAngle = 0) {
    if (this.state !== 'ALIVE') return;
    this.state = 'SHATTERING';
    this.shards = [];
    this.shardParticles = [];

    const spine = this.sampleSpine(this.pixelLength, 12);
    const numShards = Math.max(25, Math.floor(spine.length * 1.5));

    for (let i = 0; i < numShards; i++) {
      const spineIdx = Math.min(spine.length - 1, Math.floor((i / numShards) * spine.length));
      const pt = spine[spineIdx] || { x: this.x, y: this.y, angle: this.angle };

      const blastAngle = (Math.PI * 2 * Math.random());
      const speed = 40 + Math.random() * 160;

      // Create irregular polygonal shard vertices
      const verts = [];
      const numVerts = 4 + Math.floor(Math.random() * 3);
      const rad = 7 + Math.random() * 8;
      for (let v = 0; v < numVerts; v++) {
        const theta = (v * Math.PI * 2) / numVerts + (Math.random() - 0.5) * 0.5;
        verts.push({
          x: Math.cos(theta) * rad * (0.8 + Math.random() * 0.4),
          y: Math.sin(theta) * rad * (0.8 + Math.random() * 0.4)
        });
      }

      this.shards.push({
        x: pt.x + (Math.random() - 0.5) * 16,
        y: pt.y + (Math.random() - 0.5) * 16,
        vx: Math.cos(blastAngle) * speed,
        vy: Math.sin(blastAngle) * speed,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 7,
        scale: 1.0,
        drag: 0.92 + Math.random() * 0.04,
        verts: verts
      });
    }

    // Golden dust particles
    for (let p = 0; p < 45; p++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pSpeed = 20 + Math.random() * 140;
      this.shardParticles.push({
        x: this.x + (Math.random() - 0.5) * 30,
        y: this.y + (Math.random() - 0.5) * 30,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        size: 1.5 + Math.random() * 3.0
      });
    }
  }

  /**
   * Update snake position, spine trail, and growth
   */
  update(dt, renderer, onCarve) {
    if (this.state === 'SHATTERING' || this.state === 'SHATTERED') {
      // Update exploding shards
      for (let s of this.shards) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= s.drag;
        s.vy *= s.drag;
        s.angle += s.vRot * dt;
        s.vRot *= 0.95;
      }
      for (let i = this.shardParticles.length - 1; i >= 0; i--) {
        const p = this.shardParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.life -= p.decay;
        if (p.life <= 0) this.shardParticles.splice(i, 1);
      }
      return;
    }

    // Apply next queued direction
    if (this.dirQueue.length > 0) {
      this.dir = this.dirQueue.shift();
      this.targetAngle = Math.atan2(this.dir.y, this.dir.x);
    }

    // Smooth angle interpolation for fluid rounded corners
    let dAngle = this.targetAngle - this.angle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    this.angle += dAngle * Math.min(1, dt * 22);

    const prevX = this.x;
    const prevY = this.y;

    // Advance head position
    const moveDist = this.speed * dt;
    this.x += Math.cos(this.angle) * moveDist;
    this.y += Math.sin(this.angle) * moveDist;

    // Carve pressed sand trench track in real-time
    if (renderer && onCarve) {
      onCarve(prevX, prevY, this.x, this.y);
    }

    // Push new point into path history
    this.pathHistory.unshift({
      x: this.x,
      y: this.y,
      angle: this.angle
    });

    // Prune history to required length + buffer
    const maxPoints = Math.ceil(this.targetPixelLength * 1.5) + 200;
    if (this.pathHistory.length > maxPoints) {
      this.pathHistory.length = maxPoints;
    }

    // Smooth growth interpolation
    if (this.pixelLength < this.targetPixelLength) {
      this.pixelLength = Math.min(this.targetPixelLength, this.pixelLength + dt * 45);
    }
  }

  /**
   * Sample dense spine coordinates along the recorded path history
   */
  sampleSpine(totalDist, step = 3.5) {
    if (this.pathHistory.length < 2) return [];

    const spine = [];
    spine.push({
      x: this.pathHistory[0].x,
      y: this.pathHistory[0].y,
      angle: this.pathHistory[0].angle,
      dist: 0
    });

    let accumulatedDist = 0;
    let nextTarget = step;

    for (let i = 1; i < this.pathHistory.length && nextTarget <= totalDist; i++) {
      const p1 = this.pathHistory[i - 1];
      const p2 = this.pathHistory[i];
      const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      while (accumulatedDist + segDist >= nextTarget && nextTarget <= totalDist) {
        const ratio = (nextTarget - accumulatedDist) / (segDist || 1);
        const sx = p1.x + (p2.x - p1.x) * ratio;
        const sy = p1.y + (p2.y - p1.y) * ratio;
        const sAngle = p1.angle + (p2.angle - p1.angle) * ratio;

        spine.push({
          x: sx,
          y: sy,
          angle: sAngle,
          dist: nextTarget
        });

        nextTarget += step;
      }
      accumulatedDist += segDist;
    }

    return spine;
  }

  /**
   * Check self-collision in Classic Mode
   */
  checkSelfCollision() {
    if (this.state !== 'ALIVE') return false;
    const spine = this.sampleSpine(this.pixelLength, 8);
    // Ignore first 96px (head and neck turn radius)
    for (let i = 12; i < spine.length; i++) {
      const pt = spine[i];
      const d = Math.hypot(this.x - pt.x, this.y - pt.y);
      if (d < this.bodyRadius * 1.15) {
        return true;
      }
    }
    return false;
  }

  /**
   * Pre-generate organic branchlets along the snake's spine
   */
  generateBranchlets(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        side: i % 2 === 0 ? 1 : -1, // alternate left and right
        curve: 0.6 + Math.random() * 0.6,
        length: 7 + Math.random() * 4,
        hasFork: Math.random() > 0.4
      });
    }
    return list;
  }

  /**
   * Master Draw Routine
   */
  draw(ctx) {
    if (this.state === 'SHATTERING' || this.state === 'SHATTERED') {
      this.drawShattered(ctx);
      return;
    }

    const spine = this.sampleSpine(this.pixelLength, 3.2);
    if (spine.length < 4) return;

    // 1. Draw Body Ambient Drop Shadow
    this.drawBodyShadow(ctx, spine);

    // 2. Draw Continuous 3D Cylindrical Urushi Lacquer Body
    this.drawContinuousBody(ctx, spine);

    // 3. Draw Side Rib Notches (Caterpillar/Ceramic Texture)
    this.drawRibNotches(ctx, spine);

    // 4. Draw Continuous Golden Kintsugi Vine & Sprouting Branchlets
    this.drawKintsugiVine(ctx, spine);

    // 5. Draw Tapered Tail Tip & Beaded Finial
    this.drawTailBeads(ctx, spine);

    // 6. Draw Bulbous Urushi Lacquer Head with Golden Eyes & Nose Stem
    this.drawHead(ctx, spine[0]);
  }

  /**
   * Draw ambient shadow cast onto the pressed sand
   */
  drawBodyShadow(ctx, spine) {
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.bodyRadius * 2 + 2;
    ctx.strokeStyle = 'rgba(85, 72, 60, 0.26)';

    ctx.moveTo(spine[0].x + 2, spine[0].y + 3);
    for (let i = 1; i < spine.length; i++) {
      ctx.lineTo(spine[i].x + 2, spine[i].y + 3);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw seamless continuous cylindrical body with 3D volume lighting
   */
  drawContinuousBody(ctx, spine) {
    const rad = this.bodyRadius;

    // Calculate left and right perimeter boundary points
    const leftEdge = [];
    const rightEdge = [];

    for (let i = 0; i < spine.length; i++) {
      const pt = spine[i];
      const distFromTail = this.pixelLength - pt.dist;

      // Width tapering near tail
      let w = rad;
      if (distFromTail < 45) {
        w = 4.5 + (rad - 4.5) * (distFromTail / 45);
      }

      // Normal vector perpendicular to angle
      const nx = -Math.sin(pt.angle);
      const ny = Math.cos(pt.angle);

      leftEdge.push({ x: pt.x + nx * w, y: pt.y + ny * w });
      rightEdge.push({ x: pt.x - nx * w, y: pt.y - ny * w });
    }

    ctx.save();

    // Golden Blessing Aura
    if (this.isGoldenBuffActive) {
      ctx.shadowColor = '#eec45c';
      ctx.shadowBlur = 20;
    }

    // 1. Draw Base Dark Lacquer Ribbon
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < leftEdge.length; i++) {
      ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    }
    // Round tail cap
    const tailPt = spine[spine.length - 1];
    ctx.arc(tailPt.x, tailPt.y, 4.5, tailPt.angle + Math.PI / 2, tailPt.angle - Math.PI / 2, true);

    for (let i = rightEdge.length - 1; i >= 0; i--) {
      ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = '#1c1a18';
    ctx.fill();

    // 2. 3D Cylindrical Volume Shading (Stroke highlight running along spine)
    // Subtle glossy streak off-center giving cylindrical depth
    ctx.beginPath();
    ctx.moveTo(spine[0].x, spine[0].y);
    for (let i = 1; i < spine.length; i++) {
      const pt = spine[i];
      const nx = -Math.sin(pt.angle);
      const ny = Math.cos(pt.angle);
      // Offset slightly to the left for directional light catch
      ctx.lineTo(pt.x + nx * 4.2, pt.y + ny * 4.2);
    }
    ctx.strokeStyle = 'rgba(75, 70, 65, 0.45)';
    ctx.lineWidth = rad * 1.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Center lighter specular sheen
    ctx.beginPath();
    ctx.moveTo(spine[0].x, spine[0].y);
    for (let i = 1; i < spine.length; i++) {
      const pt = spine[i];
      const nx = -Math.sin(pt.angle);
      const ny = Math.cos(pt.angle);
      ctx.lineTo(pt.x + nx * 3.0, pt.y + ny * 3.0);
    }
    ctx.strokeStyle = 'rgba(120, 110, 100, 0.32)';
    ctx.lineWidth = rad * 0.45;
    ctx.stroke();

    // Dark edge rim strokes
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < leftEdge.length; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEdge[0].x, rightEdge[0].y);
    for (let i = 1; i < rightEdge.length; i++) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw subtle ribbed notch texture along the edge (matches Image 3)
   */
  drawRibNotches(ctx, spine) {
    ctx.save();
    const notchSpacing = 6.0;
    let nextNotchDist = 18; // start behind neck

    for (let i = 1; i < spine.length; i++) {
      const pt = spine[i];
      if (pt.dist >= nextNotchDist && pt.dist <= this.pixelLength - 30) {
        const nx = -Math.sin(pt.angle);
        const ny = Math.cos(pt.angle);
        const w = this.bodyRadius;

        // Left rim notch mark
        const lx = pt.x + nx * (w - 1.2);
        const ly = pt.y + ny * (w - 1.2);

        ctx.beginPath();
        ctx.arc(lx, ly, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fill();

        nextNotchDist += notchSpacing;
      }
    }
    ctx.restore();
  }

  /**
   * Draw continuous golden Kintsugi vine with organic branching twigs
   * (Directly reproduces the vine in Image 3)
   */
  drawKintsugiVine(ctx, spine) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Main wandering dorsal vine line
    ctx.beginPath();
    let branchletIdx = 0;

    for (let i = 0; i < spine.length; i++) {
      const pt = spine[i];
      if (pt.dist > this.pixelLength - 20) break; // stops before tail tip

      // Organic meandering wave across spine center
      const meander = Math.sin(pt.dist * 0.055) * 2.8 + Math.sin(pt.dist * 0.02) * 1.8;
      const nx = -Math.sin(pt.angle);
      const ny = Math.cos(pt.angle);

      const vx = pt.x + nx * meander;
      const vy = pt.y + ny * meander;

      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);

      // Branchlet sprouting every ~48px
      if (pt.dist > 28 && Math.floor(pt.dist / 48) > branchletIdx) {
        branchletIdx = Math.floor(pt.dist / 48);
        const bData = this.branchlets[branchletIdx % this.branchlets.length];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(vx, vy);

        // Branch outward toward body edge
        const bLen = bData.length;
        const bSide = bData.side;
        const bx1 = vx + nx * (bSide * bLen * 0.6) - Math.cos(pt.angle) * 3;
        const by1 = vy + ny * (bSide * bLen * 0.6) - Math.sin(pt.angle) * 3;
        const bx2 = vx + nx * (bSide * bLen) - Math.cos(pt.angle) * 7;
        const by2 = vy + ny * (bSide * bLen) - Math.sin(pt.angle) * 7;

        ctx.quadraticCurveTo(bx1, by1, bx2, by2);
        ctx.strokeStyle = '#eec45c';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Tiny curl or leaf at twig end
        ctx.beginPath();
        ctx.arc(bx2, by2, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fce280';
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.strokeStyle = '#eec45c';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Subtle inner gold shimmer line
    ctx.strokeStyle = '#fff0a6';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw tapered tail tip ending in 3 small decorative beads
   * (Directly reproduces the tail in Image 3)
   */
  drawTailBeads(ctx, spine) {
    if (spine.length < 5) return;
    const lastPt = spine[spine.length - 1];

    ctx.save();
    ctx.translate(lastPt.x, lastPt.y);
    ctx.rotate(lastPt.angle);

    // Three graduated beads tapering outward from tail
    const beads = [
      { offset: -3.5, radius: 5.5 },
      { offset: -10.5, radius: 4.0 },
      { offset: -16.5, radius: 2.8 }
    ];

    beads.forEach(b => {
      // Bead Drop shadow
      ctx.beginPath();
      ctx.arc(b.offset + 1, 1.5, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(85, 72, 60, 0.25)';
      ctx.fill();

      // Bead Lacquer Body
      ctx.beginPath();
      ctx.arc(b.offset, 0, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#181715';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80, 75, 70, 0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Subtle gold dot on first bead
      if (b.radius > 4.0) {
        ctx.beginPath();
        ctx.arc(b.offset, 0, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = '#eec45c';
        ctx.fill();
      }
    });

    ctx.restore();
  }

  /**
   * Draw Bulbous Dome Head with Golden Eyes and Nose Stem
   * (Directly reproduces the head in Image 3 & Image 2)
   */
  drawHead(ctx, headPt) {
    ctx.save();
    ctx.translate(headPt.x, headPt.y);
    ctx.rotate(headPt.angle);

    const hl = 42; // head length (scaled up)
    const hw = 19.5; // head half-width

    // 1. Head Ambient Drop Shadow
    ctx.beginPath();
    ctx.ellipse(2, 2.5, hl * 0.55, hw * 0.95, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(85, 72, 60, 0.32)';
    ctx.fill();

    // Golden Blessing Glow on Head
    if (this.isGoldenBuffActive) {
      ctx.shadowColor = '#eec45c';
      ctx.shadowBlur = 22;
    }

    // 2. Bulbous Rounded Dome Contour
    ctx.beginPath();
    ctx.moveTo(hl * 0.5, 0); // nose tip
    // Top dome curve
    ctx.bezierCurveTo(hl * 0.45, -hw * 0.95, -hl * 0.15, -hw * 1.05, -hl * 0.48, -hw * 0.85);
    // Neck collar indentation
    ctx.quadraticCurveTo(-hl * 0.55, 0, -hl * 0.48, hw * 0.85);
    // Bottom dome curve
    ctx.bezierCurveTo(-hl * 0.15, hw * 1.05, hl * 0.45, hw * 0.95, hl * 0.5, 0);
    ctx.closePath();

    // Glossy Urushi Black Lacquer Gradient
    const headGrad = ctx.createLinearGradient(0, -hw, 0, hw);
    headGrad.addColorStop(0, '#32302e');
    headGrad.addColorStop(0.25, '#22201e');
    headGrad.addColorStop(0.7, '#161514');
    headGrad.addColorStop(1, '#0e0d0c');
    ctx.fillStyle = headGrad;
    ctx.fill();

    // Outer rim stroke
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Neck Collar Seam (Subtle indentation groove)
    ctx.beginPath();
    ctx.moveTo(-hl * 0.45, -hw * 0.8);
    ctx.quadraticCurveTo(-hl * 0.48, 0, -hl * 0.45, hw * 0.8);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-hl * 0.43, -hw * 0.7);
    ctx.quadraticCurveTo(-hl * 0.46, 0, -hl * 0.43, hw * 0.7);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // 3. Golden Nose Stem / Beak Line (Between the eyes, exactly as seen in Image 3!)
    ctx.beginPath();
    ctx.moveTo(hl * 0.45, 0); // snout tip
    ctx.lineTo(hl * 0.05, 0); // between eyes
    ctx.strokeStyle = '#eec45c';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 4. Golden Eyes with Dark Pupils (Positioned symmetrically on head sides)
    const eyeX = hl * 0.16;
    const eyeY = hw * 0.58;
    const eyeRad = 4.8;

    [-eyeY, eyeY].forEach(y => {
      // Golden Eye Iris
      ctx.beginPath();
      ctx.arc(eyeX, y, eyeRad, 0, Math.PI * 2);
      ctx.fillStyle = '#f5cb4e';
      ctx.fill();

      // Outer gold rim
      ctx.strokeStyle = '#c89d38';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Black Pupil (looking forward)
      ctx.beginPath();
      ctx.arc(eyeX + 1.0, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#11100f';
      ctx.fill();

      // Tiny white specular glint
      ctx.beginPath();
      ctx.arc(eyeX + 1.5, y - 0.8, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Draw Shattered Kintsugi Shards upon Death (Matches Image 1)
   */
  drawShattered(ctx) {
    // 1. Draw Gold Dust Particles
    for (let p of this.shardParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = '#f5cb4e';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw Polygonal Obsidian Kintsugi Shards
    for (let s of this.shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      const verts = s.verts;
      if (!verts || verts.length < 3) {
        ctx.restore();
        continue;
      }

      // Shard Shadow
      ctx.beginPath();
      ctx.moveTo(verts[0].x + 2, verts[0].y + 2);
      for (let v = 1; v < verts.length; v++) {
        ctx.lineTo(verts[v].x + 2, verts[v].y + 2);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(75, 62, 50, 0.25)';
      ctx.fill();

      // Shard Obsidian Stone Body
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let v = 1; v < verts.length; v++) {
        ctx.lineTo(verts[v].x, verts[v].y);
      }
      ctx.closePath();

      const stoneGrad = ctx.createLinearGradient(-10, -10, 10, 10);
      stoneGrad.addColorStop(0, '#2d2b29');
      stoneGrad.addColorStop(0.5, '#1b1a19');
      stoneGrad.addColorStop(1, '#0e0d0c');
      ctx.fillStyle = stoneGrad;
      ctx.fill();

      // Gleaming Gold Kintsugi Border
      ctx.strokeStyle = '#eec45c';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'miter';
      ctx.stroke();

      ctx.restore();
    }
  }
}

window.ZenSnake = ZenSnake;
