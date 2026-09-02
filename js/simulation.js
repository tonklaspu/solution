/**
 * Beaker & Solute Particle Visual Simulation
 * Real-time rendering on HTML5 Canvas
 */

class BeakerSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Simulation state
    this.currentSolute = 10; // in grams or mL
    this.currentTotalVolume = 200; // in mL
    this.maxBeakerVolume = 500; // mL
    this.concentrationPercent = 5.0; // %
    this.chemicalId = 'cuso4';
    this.customRgb = [30, 144, 255];

    // Animation state
    this.time = 0;
    this.isStirring = false;
    this.stirAngle = 0;
    this.stirCooldown = 0;
    this.targetLiquidHeightRatio = 0.4;
    this.currentLiquidHeightRatio = 0.4;

    // Particle system
    this.particles = [];
    this.maxParticles = 200;
    this.precipitateParticles = []; // settled at bottom

    // Dimension bounds for beaker
    this.beaker = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      radius: 14,
      bottomY: 0,
      topY: 0
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 360;
    this.height = rect.height || 420;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform?.() || this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Calculate beaker boundaries
    const paddingX = Math.max(35, this.width * 0.12);
    const paddingTop = 50;
    const paddingBottom = 45;

    this.beaker.width = this.width - paddingX * 2;
    this.beaker.height = this.height - paddingTop - paddingBottom;
    this.beaker.x = paddingX;
    this.beaker.y = paddingTop;
    this.beaker.topY = paddingTop;
    this.beaker.bottomY = paddingTop + this.beaker.height;

    this.initParticles();
  }

  /**
   * Update parameters from external controls
   */
  update({ solute, totalVolume, percentage, chemicalId, customColorHex }) {
    this.currentSolute = Math.max(0, solute || 0);
    this.currentTotalVolume = Math.max(10, totalVolume || 100);
    this.concentrationPercent = Math.max(0, Math.min(100, percentage || 0));
    this.chemicalId = chemicalId || 'cuso4';

    if (chemicalId === 'custom' && customColorHex) {
      this.customRgb = this.hexToRgb(customColorHex);
    }

    // Dynamic scale adjustment if volume exceeds standard 500 mL
    if (this.currentTotalVolume > 500) {
      this.maxBeakerVolume = Math.ceil(this.currentTotalVolume / 250) * 250;
    } else {
      this.maxBeakerVolume = 500;
    }

    // Target liquid height ratio (clamped between 0.05 and 0.92)
    this.targetLiquidHeightRatio = Math.min(0.92, Math.max(0.08, this.currentTotalVolume / this.maxBeakerVolume));

    this.updateParticleCount();
  }

  hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  triggerStir() {
    this.isStirring = true;
    this.stirCooldown = 180; // ~3 seconds at 60fps
  }

  initParticles() {
    this.particles = [];
    this.precipitateParticles = [];
    this.updateParticleCount();
  }

  updateParticleCount() {
    // Determine particle count based on concentration percentage (0 to maxParticles)
    const targetCount = Math.min(this.maxParticles, Math.round((this.concentrationPercent / 35) * 120));
    
    // Check for saturation threshold (e.g. over 30% for solids)
    const chemical = CHEMICAL_PRESETS[this.chemicalId] || CHEMICAL_PRESETS.cuso4;
    const isSaturated = chemical.state === 'solid' && (this.concentrationPercent > 28);
    const targetPrecipitateCount = isSaturated ? Math.min(80, Math.round((this.concentrationPercent - 28) * 3)) : 0;

    // Adjust floating particles
    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle());
    }
    while (this.particles.length > targetCount) {
      this.particles.pop();
    }

    // Adjust precipitate particles
    while (this.precipitateParticles.length < targetPrecipitateCount) {
      this.precipitateParticles.push(this.createPrecipitateParticle());
    }
    while (this.precipitateParticles.length > targetPrecipitateCount) {
      this.precipitateParticles.pop();
    }
  }

  createParticle() {
    const liquidTop = this.beaker.bottomY - (this.beaker.height * this.currentLiquidHeightRatio);
    return {
      x: this.beaker.x + 15 + Math.random() * (this.beaker.width - 30),
      y: liquidTop + 10 + Math.random() * (this.beaker.bottomY - liquidTop - 20),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 2.5 + 2,
      alpha: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.05
    };
  }

  createPrecipitateParticle() {
    return {
      x: this.beaker.x + 12 + Math.random() * (this.beaker.width - 24),
      y: this.beaker.bottomY - 4 - Math.random() * 8,
      size: Math.random() * 3 + 2,
      rotation: Math.random() * Math.PI * 2
    };
  }

  getActiveRgb() {
    if (this.chemicalId === 'custom') return this.customRgb;
    const chem = CHEMICAL_PRESETS[this.chemicalId] || CHEMICAL_PRESETS.cuso4;
    return chem.colorRgb;
  }

  animate() {
    this.time += 0.035;

    // Smooth liquid height transition
    this.currentLiquidHeightRatio += (this.targetLiquidHeightRatio - this.currentLiquidHeightRatio) * 0.08;

    // Handle stirring timer
    if (this.isStirring) {
      this.stirAngle += 0.18;
      this.stirCooldown--;
      if (this.stirCooldown <= 0) {
        this.isStirring = false;
      }
    }

    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const b = this.beaker;
    const liquidHeight = b.height * this.currentLiquidHeightRatio;
    const liquidTopY = b.bottomY - liquidHeight;

    // 1. Draw Lab Background Bench & Shadow
    this.drawBeakerShadow(ctx, b);

    // 2. Draw Liquid (with concentration color, meniscus, wave)
    this.drawLiquid(ctx, b, liquidTopY, liquidHeight);

    // 3. Draw Solute Particles inside liquid
    this.drawParticles(ctx, b, liquidTopY);

    // 4. Draw Precipitate if saturated
    this.drawPrecipitate(ctx);

    // 5. Draw Stirring Rod if stirring
    if (this.isStirring) {
      this.drawStirringRod(ctx, b, liquidTopY);
    }

    // 6. Draw Glass Beaker Outline, Spout, Reflections
    this.drawBeakerGlass(ctx, b);

    // 7. Draw Volume Scale & Graduations
    this.drawGraduations(ctx, b);

    // 8. Draw Real-time Status Badge in Beaker
    this.drawStatusOverlay(ctx, b, liquidTopY);
  }

  drawBeakerShadow(ctx, b) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.x + b.width / 2, b.bottomY + 10, b.width / 2 + 10, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.filter = 'blur(8px)';
    ctx.fill();
    ctx.restore();
  }

  drawLiquid(ctx, b, liquidTopY, liquidHeight) {
    if (liquidHeight <= 2) return;

    const rgb = this.getActiveRgb();
    // Calculate color opacity and darkness based on concentration percentage
    // Low concentration (e.g. 1%) -> light, transparent (alpha 0.18)
    // High concentration (e.g. 30%) -> rich, intense (alpha 0.85)
    const concRatio = Math.min(1, Math.max(0.05, this.concentrationPercent / 30));
    const baseAlpha = 0.15 + (concRatio * 0.72);
    
    ctx.save();

    // Clip to inside beaker shape so liquid does not spill out
    ctx.beginPath();
    this.traceBeakerPath(ctx, b, 3); // 3px inside wall
    ctx.clip();

    // Liquid gradient (darker at bottom due to depth, subtle gradient)
    const grad = ctx.createLinearGradient(0, liquidTopY, 0, b.bottomY);
    const r = Math.round(rgb[0] * (0.8 + 0.2 * (1 - concRatio)));
    const g = Math.round(rgb[1] * (0.8 + 0.2 * (1 - concRatio)));
    const bColor = Math.round(rgb[2] * (0.8 + 0.2 * (1 - concRatio)));

    grad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${baseAlpha * 0.85})`);
    grad.addColorStop(0.7, `rgba(${r}, ${g}, ${bColor}, ${baseAlpha})`);
    grad.addColorStop(1, `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, bColor - 20)}, ${Math.min(0.95, baseAlpha + 0.12)})`);

    ctx.beginPath();
    ctx.moveTo(b.x + 3, b.bottomY);
    ctx.lineTo(b.x + 3, liquidTopY);

    // Wave / Meniscus effect on liquid surface
    const waveAmp = this.isStirring ? 4.5 : 1.8;
    const waveFreq = this.isStirring ? 0.04 : 0.02;
    const steps = 30;
    const stepW = (b.width - 6) / steps;

    for (let i = 0; i <= steps; i++) {
      const curX = b.x + 3 + i * stepW;
      const vortex = this.isStirring ? Math.sin((i / steps) * Math.PI) * 10 : 0;
      const waveY = liquidTopY + Math.sin(this.time * 3 + i * 0.4) * waveAmp + vortex;
      ctx.lineTo(curX, waveY);
    }

    ctx.lineTo(b.x + b.width - 3, b.bottomY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Surface Meniscus highlight line
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const curX = b.x + 3 + i * stepW;
      const vortex = this.isStirring ? Math.sin((i / steps) * Math.PI) * 10 : 0;
      const waveY = liquidTopY + Math.sin(this.time * 3 + i * 0.4) * waveAmp + vortex;
      if (i === 0) ctx.moveTo(curX, waveY);
      else ctx.lineTo(curX, waveY);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + concRatio * 0.4})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  drawParticles(ctx, b, liquidTopY) {
    if (this.particles.length === 0) return;

    const chem = CHEMICAL_PRESETS[this.chemicalId] || CHEMICAL_PRESETS.cuso4;
    const pColor = chem.particleColor || '#ffffff';
    const shape = chem.particleShape || 'dot';

    ctx.save();
    // Clip particles to liquid area
    ctx.beginPath();
    this.traceBeakerPath(ctx, b, 4);
    ctx.clip();

    this.particles.forEach(p => {
      // Brownian physics / gentle drift
      if (this.isStirring) {
        // Swirl around center
        const centerX = b.x + b.width / 2;
        const dist = p.x - centerX;
        p.vx += (-dist * 0.05) + (Math.random() - 0.5) * 1.5;
        p.vy += Math.sin(p.x * 0.05 + this.stirAngle) * 0.8;
      } else {
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy += (Math.random() - 0.5) * 0.3;
        p.vx *= 0.95;
        p.vy *= 0.95;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      // Bounce off beaker walls
      const minX = b.x + 8;
      const maxX = b.x + b.width - 8;
      const minY = liquidTopY + 6;
      const maxY = b.bottomY - 8;

      if (p.x < minX) { p.x = minX; p.vx *= -1; }
      if (p.x > maxX) { p.x = maxX; p.vx *= -1; }
      if (p.y < minY) { p.y = minY; p.vy *= -1; }
      if (p.y > maxY) { p.y = maxY; p.vy *= -1; }

      // Draw individual particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = pColor;
      ctx.globalAlpha = p.alpha;

      if (shape === 'crystal' || shape === 'cube') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (shape === 'droplet') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Dot
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  drawPrecipitate(ctx) {
    if (this.precipitateParticles.length === 0) return;

    const chem = CHEMICAL_PRESETS[this.chemicalId] || CHEMICAL_PRESETS.cuso4;
    const pColor = chem.particleColor || '#ffffff';

    ctx.save();
    ctx.fillStyle = pColor;
    this.precipitateParticles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // Label precipitate
    const b = this.beaker;
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ มีตะกอนนอนก้น (สารละลายอิ่มตัว)', b.x + b.width / 2, b.bottomY - 14);
    ctx.restore();
  }

  drawStirringRod(ctx, b, liquidTopY) {
    ctx.save();
    const centerX = b.x + b.width / 2 + Math.sin(this.stirAngle) * 20;
    const topX = b.x + b.width / 2 - 25;

    ctx.beginPath();
    ctx.moveTo(topX, b.topY - 30);
    ctx.lineTo(centerX, b.bottomY - 15);
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.stroke();

    // Glass core
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();
    ctx.restore();
  }

  drawBeakerGlass(ctx, b) {
    ctx.save();

    // Beaker body path with curved bottom corners & spout
    ctx.beginPath();
    // Left rim and spout
    ctx.moveTo(b.x - 10, b.topY); // Spout tip
    ctx.lineTo(b.x, b.topY + 6);
    ctx.lineTo(b.x, b.bottomY - b.radius);
    // Bottom left curve
    ctx.arcTo(b.x, b.bottomY, b.x + b.radius, b.bottomY, b.radius);
    // Bottom flat
    ctx.lineTo(b.x + b.width - b.radius, b.bottomY);
    // Bottom right curve
    ctx.arcTo(b.x + b.width, b.bottomY, b.x + b.width, b.bottomY - b.radius, b.radius);
    // Right wall
    ctx.lineTo(b.x + b.width, b.topY + 6);
    ctx.lineTo(b.x + b.width + 4, b.topY); // Right rim lip

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner glass reflection highlight on left side
    const leftGlow = ctx.createLinearGradient(b.x, 0, b.x + 25, 0);
    leftGlow.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    leftGlow.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = leftGlow;
    ctx.fillRect(b.x + 3, b.topY + 10, 20, b.height - 15);

    // Rim top lip
    ctx.beginPath();
    ctx.ellipse(b.x + b.width / 2, b.topY + 4, b.width / 2 + 3, 5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lab Brand Mark (like Pyrex / Boro 3.3)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHEM-LAB', b.x + b.width / 2, b.topY + 35);
    ctx.font = '400 9px JetBrains Mono, monospace';
    ctx.fillText(`BORO 3.3 • ${this.maxBeakerVolume} mL`, b.x + b.width / 2, b.topY + 48);

    ctx.restore();
  }

  drawGraduations(ctx, b) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '500 10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    // Step marks: 100, 200, 300, 400, 500 mL
    const stepVolume = this.maxBeakerVolume >= 1000 ? 200 : 100;
    const totalSteps = Math.floor(this.maxBeakerVolume / stepVolume);

    for (let i = 1; i <= totalSteps; i++) {
      const vol = i * stepVolume;
      const ratio = vol / this.maxBeakerVolume;
      const y = b.bottomY - (b.height * ratio);

      if (y > b.topY + 20) {
        // Major tick
        ctx.beginPath();
        ctx.moveTo(b.x + b.width - 2, y);
        ctx.lineTo(b.x + b.width - 18, y);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillText(`${vol}`, b.x + b.width - 22, y + 3.5);

        // Minor tick (midway)
        const midVol = vol - (stepVolume / 2);
        const midRatio = midVol / this.maxBeakerVolume;
        const midY = b.bottomY - (b.height * midRatio);
        if (midY > b.topY + 20) {
          ctx.beginPath();
          ctx.moveTo(b.x + b.width - 2, midY);
          ctx.lineTo(b.x + b.width - 10, midY);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawStatusOverlay(ctx, b, liquidTopY) {
    ctx.save();
    // Indicator tag floating near current liquid surface
    const currentVol = Math.round(this.currentTotalVolume);
    const conc = this.concentrationPercent.toFixed(1);

    // Indicator line from surface to the left
    ctx.beginPath();
    ctx.moveTo(b.x, liquidTopY);
    ctx.lineTo(b.x - 8, liquidTopY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volume readout text on left side
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentVol} mL`, b.x - 12, liquidTopY + 4);

    ctx.restore();
  }

  traceBeakerPath(ctx, b, inset = 0) {
    const r = Math.max(2, b.radius - inset);
    ctx.moveTo(b.x + inset, b.topY + 8);
    ctx.lineTo(b.x + inset, b.bottomY - inset - r);
    ctx.arcTo(b.x + inset, b.bottomY - inset, b.x + inset + r, b.bottomY - inset, r);
    ctx.lineTo(b.x + b.width - inset - r, b.bottomY - inset);
    ctx.arcTo(b.x + b.width - inset, b.bottomY - inset, b.x + b.width - inset, b.bottomY - inset - r, r);
    ctx.lineTo(b.x + b.width - inset, b.topY + 8);
  }
}
