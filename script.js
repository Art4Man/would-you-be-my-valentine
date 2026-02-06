// ============================================
//  Valentine's Interactive Script
// ============================================

(function () {
  'use strict';

  // --- DOM Elements ---
  const btnYes = document.getElementById('btnYes');
  const btnNo = document.getElementById('btnNo');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('overlay');
  const valentineVideo = document.getElementById('valentineVideo');
  const fireworkVideo = document.getElementById('fireworkVideo');
  const chromaCanvas = document.getElementById('chromaCanvas');
  const ctx = chromaCanvas.getContext('2d', { willReadFrequently: true });
  const fairyContainer = document.getElementById('fairyContainer');

  // ============================================
  //  FAIRY HEART ANIMATION
  // ============================================
  const FAIRY_EMOJI = '🏹';
  const HEART_EMOJI = '❤️';
  let fairyAnimationRunning = true;
  let fairyPaused = false;
  let lastShootTime = 0;

  /**
   * Get random position for fairy (top 10% to 70% of screen height)
   */
  function getRandomY() {
    return Math.random() * 60 + 10; // 10% to 70%
  }

  /**
   * Create a fairy element at random position
   */
  function createFairy(side) {
    const fairy = document.createElement('div');
    fairy.className = `fairy ${side === 'right' ? 'right-side' : ''}`;
    fairy.textContent = FAIRY_EMOJI;
    
    const yPos = getRandomY();
    fairy.style.top = yPos + '%';
    
    if (side === 'left') {
      fairy.style.left = '2%';
    } else {
      fairy.style.right = '2%';
    }
    
    fairy.dataset.side = side;
    fairy.dataset.yPos = yPos;
    
    return fairy;
  }

  /**
   * Get random position (left/right side + random Y)
   */
  function getRandomSide() {
    return Math.random() > 0.5 ? 'left' : 'right';
  }

  /**
   * Teleport fairy: fade out, reappear at random position
   */
  function teleportFairy(fairy) {
    // Fade out
    fairy.style.transition = 'opacity 0.3s ease';
    fairy.style.opacity = '0';

    setTimeout(() => {
      // Pick new random position on either side
      const newSide = getRandomSide();
      const newY = getRandomY();

      // Reset position
      fairy.style.left = '';
      fairy.style.right = '';

      if (newSide === 'left') {
        fairy.style.left = '2%';
        fairy.className = 'fairy';
      } else {
        fairy.style.right = '2%';
        fairy.className = 'fairy right-side';
      }

      fairy.style.top = newY + '%';
      fairy.dataset.side = newSide;
      fairy.dataset.yPos = newY;

      // Fade back in
      setTimeout(() => {
        fairy.style.transition = 'opacity 0.4s ease';
        fairy.style.opacity = '0.85';
      }, 100);
    }, 350);
  }

  /**
   * Create and shoot a heart from a fairy, then teleport the fairy
   */
  function shootHeart(fairy) {
    if (!fairyAnimationRunning) return;
    
    const heart = document.createElement('div');
    heart.className = 'flying-heart';
    heart.textContent = HEART_EMOJI;
    
    const side = fairy.dataset.side;
    const yPos = Number.parseFloat(fairy.dataset.yPos);
    
    heart.style.top = yPos + '%';
    
    if (side === 'left') {
      heart.style.left = '6%';
      heart.classList.add('to-right');
    } else {
      heart.style.right = '6%';
      heart.classList.add('to-left');
    }
    
    fairyContainer.appendChild(heart);

    // Teleport fairy to new random position after shooting
    teleportFairy(fairy);
    
    // Remove heart after animation completes
    heart.addEventListener('animationend', () => {
      heart.remove();
    });
  }

  /**
   * Spawn fairies and start shooting hearts randomly
   */
  function startFairyAnimation() {
    // Clear any existing fairies
    fairyContainer.innerHTML = '';
    
    // Create single cupid on a random side
    const cupid = createFairy(getRandomSide());
    fairyContainer.appendChild(cupid);
    
    // Shoot hearts at random intervals
    function scheduleShoot(fairy) {
      if (!fairyAnimationRunning) return;
      
      const delay = Math.random() * 2500 + 1500; // 1.5-4 seconds
      
      setTimeout(() => {
        if (!fairyAnimationRunning) return;

        // Skip if tab is hidden — don't pile up hearts
        if (document.hidden || fairyPaused) {
          scheduleShoot(fairy);
          return;
        }
        
        shootHeart(fairy);
        scheduleShoot(fairy);
      }, delay);
    }
    
    scheduleShoot(cupid);
  }

  /**
   * Stop fairy animation
   */
  function stopFairyAnimation() {
    fairyAnimationRunning = false;
    if (fairyContainer) {
      fairyContainer.innerHTML = '';
    }
  }

  // Start fairy animation on load
  document.addEventListener('DOMContentLoaded', startFairyAnimation);

  // Pause/resume fairy animation when tab visibility changes
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      fairyPaused = true;
      // Remove any in-flight hearts so they don't pile up
      const hearts = fairyContainer.querySelectorAll('.flying-heart');
      hearts.forEach(h => h.remove());
    } else {
      fairyPaused = false;
    }
  });

  // --- Chroma Key Settings ---
  // Adjust these thresholds if the green removal isn't perfect for your video
  const CHROMA_THRESHOLD = 100;  // How green a pixel must be to remove (lower = stricter)
  const CHROMA_SMOOTHING = 0.15; // Edge softness (0 = hard edge, higher = softer)

  let chromaRunning = false;

  /**
   * Process a single video frame — remove green pixels
   */
  function processChromaFrame() {
    if (!chromaRunning || valentineVideo.paused || valentineVideo.ended) {
      return;
    }

    // Match canvas size to video's native resolution
    if (chromaCanvas.width !== valentineVideo.videoWidth ||
        chromaCanvas.height !== valentineVideo.videoHeight) {
      chromaCanvas.width = valentineVideo.videoWidth;
      chromaCanvas.height = valentineVideo.videoHeight;
    }

    // Draw current frame
    ctx.drawImage(valentineVideo, 0, 0, chromaCanvas.width, chromaCanvas.height);

    // Read pixel data
    const frame = ctx.getImageData(0, 0, chromaCanvas.width, chromaCanvas.height);
    const data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Detect green: green channel significantly higher than red and blue
      const greenDominance = g - Math.max(r, b);

      if (greenDominance > CHROMA_THRESHOLD) {
        // Fully green pixel — make transparent
        data[i + 3] = 0;
      } else if (greenDominance > CHROMA_THRESHOLD * (1 - CHROMA_SMOOTHING)) {
        // Edge pixel — partial transparency for smoother edges
        const ratio = (greenDominance - CHROMA_THRESHOLD * (1 - CHROMA_SMOOTHING)) /
                      (CHROMA_THRESHOLD * CHROMA_SMOOTHING);
        data[i + 3] = Math.round(255 * (1 - ratio));
      }
    }

    ctx.putImageData(frame, 0, 0);
    requestAnimationFrame(processChromaFrame);
  }

  /**
   * Start chroma key rendering loop
   */
  function startChromaKey() {
    if (chromaRunning) return;
    chromaRunning = true;
    requestAnimationFrame(processChromaFrame);
  }

  /**
   * Stop chroma key rendering loop
   */
  function stopChromaKey() {
    chromaRunning = false;
  }

  // --- No-button begging texts ---
  const noTexts = [
    'No',
    'Are you sure? 🤔',
    'Really sure?',
    'Think again! 💭',
    'Pretty please? 🥺',
    "I'll be sad… 😢",
    'You\'re breaking my heart 💔',
    "I'll cry!",
    "Don't do this to me! 😩",
    "I'm gonna ugly cry 😭",
    'My heart can\'t take it! 💔',
    'OK fine… just kidding, YES? 🥹',
  ];

  // --- State ---
  let noClickCount = 0;
  let yesBaseFontSize = Number.parseFloat(getComputedStyle(btnYes).fontSize);
  let yesPaddingV = Number.parseFloat(getComputedStyle(btnYes).paddingTop);
  let yesPaddingH = Number.parseFloat(getComputedStyle(btnYes).paddingLeft);

  // --- Growth multiplier per click ---
  const GROWTH_FACTOR = 1.35;

  // ============================================
  //  NO BUTTON HANDLER
  // ============================================
  btnNo.addEventListener('click', function () {
    noClickCount++;

    // 1. Cycle the No button text
    const textIndex = Math.min(noClickCount, noTexts.length - 1);
    btnNo.textContent = noTexts[textIndex];

    // 2. Shake the No button
    btnNo.classList.remove('shake');
    // Trigger reflow to restart animation
    btnNo.offsetWidth; // eslint-disable-line no-unused-expressions
    btnNo.classList.add('shake');

    // 3. Grow the Yes button
    yesBaseFontSize *= GROWTH_FACTOR;
    yesPaddingV *= GROWTH_FACTOR;
    yesPaddingH *= GROWTH_FACTOR;

    btnYes.style.fontSize = yesBaseFontSize + 'px';
    btnYes.style.padding = yesPaddingV + 'px ' + yesPaddingH + 'px';

    // 4. Add a subtle bounce to Yes button
    btnYes.style.transform = 'scale(1.1)';
    setTimeout(() => {
      btnYes.style.transform = 'scale(1)';
    }, 300);

    // 5. After many clicks, shrink the No button slightly
    if (noClickCount >= 5) {
      const shrink = Math.max(0.6, 1 - (noClickCount - 4) * 0.05);
      btnNo.style.fontSize = (14 * shrink) + 'px';
      btnNo.style.padding = (8 * shrink) + 'px ' + (16 * shrink) + 'px';
      btnNo.style.opacity = Math.max(0.5, 1 - (noClickCount - 4) * 0.06);
    }
  });

  // ============================================
  //  FIREWORKS PARTICLE SYSTEM (Google-style)
  // ============================================
  const fwCanvas = document.getElementById('fireworksCanvas');
  const fwCtx = fwCanvas.getContext('2d');
  let particles = [];
  let rockets = [];
  let fireworksRunning = false;

  const SPARK_COLORS = [
    '#ff1744', '#ff4081', '#f50057', '#d50000',  // reds/pinks
    '#ffab00', '#ffd600', '#ff6d00', '#ff9100',  // golds/oranges
    '#ffffff', '#e0e0e0',                          // whites
    '#7c4dff', '#651fff', '#6200ea',               // purples
    '#00e5ff', '#18ffff',                          // cyans
  ];

  function resizeFireworksCanvas() {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeFireworksCanvas);
  resizeFireworksCanvas();

  /**
   * A rocket that flies up then explodes
   */
  function createRocket(x, targetY) {
    return {
      x: x,
      y: fwCanvas.height,
      targetY: targetY,
      speed: Math.random() * 3 + 4,
      trail: [],
      alive: true,
    };
  }

  /**
   * A spark particle from an explosion
   */
  function createSpark(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: Math.random() * 0.015 + 0.008,
      color: color,
      size: Math.random() * 3 + 1,
      gravity: 0.04,
      trail: [],
    };
  }

  /**
   * Explode a rocket into sparks
   */
  function explodeRocket(x, y) {
    const count = Math.floor(Math.random() * 60) + 50;
    for (let i = 0; i < count; i++) {
      particles.push(createSpark(x, y));
    }
  }

  /**
   * Launch a rocket from a random X position
   */
  function launchRocket() {
    const x = Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1;
    const targetY = Math.random() * fwCanvas.height * 0.4 + fwCanvas.height * 0.1;
    rockets.push(createRocket(x, targetY));
  }

  /**
   * Update and draw all particles and rockets
   */
  function fireworksLoop() {
    if (!fireworksRunning) return;

    fwCtx.globalCompositeOperation = 'destination-out';
    fwCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);
    fwCtx.globalCompositeOperation = 'lighter';

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      
      // Trail
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();

      // Draw trail
      for (let t = 0; t < r.trail.length; t++) {
        const alpha = t / r.trail.length * 0.6;
        fwCtx.beginPath();
        fwCtx.arc(r.trail[t].x, r.trail[t].y, 2, 0, Math.PI * 2);
        fwCtx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        fwCtx.fill();
      }

      // Draw rocket head
      fwCtx.beginPath();
      fwCtx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      fwCtx.fillStyle = '#fff';
      fwCtx.fill();

      // Move up
      r.y -= r.speed;
      r.x += (Math.random() - 0.5) * 0.5;

      // Explode when reaching target
      if (r.y <= r.targetY) {
        explodeRocket(r.x, r.y);
        rockets.splice(i, 1);
      }
    }

    // Update spark particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Trail
      p.trail.push({ x: p.x, y: p.y, life: p.life });
      if (p.trail.length > 5) p.trail.shift();

      // Draw trail
      for (let t = 0; t < p.trail.length; t++) {
        const pt = p.trail[t];
        const alpha = (t / p.trail.length) * pt.life * 0.4;
        fwCtx.beginPath();
        fwCtx.arc(pt.x, pt.y, p.size * 0.5, 0, Math.PI * 2);
        fwCtx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        // Fallback for hex colors
        fwCtx.globalAlpha = alpha;
        fwCtx.fillStyle = p.color;
        fwCtx.fill();
        fwCtx.globalAlpha = 1;
      }

      // Draw spark
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.globalAlpha = p.life;
      fwCtx.fillStyle = p.color;
      fwCtx.fill();
      fwCtx.globalAlpha = 1;

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(fireworksLoop);
  }

  /**
   * Start the fireworks show — launch multiple rockets in waves
   */
  function startFireworks() {
    fireworksRunning = true;
    resizeFireworksCanvas();
    fireworksLoop();

    // Wave 1: 3 rockets immediately
    for (let i = 0; i < 3; i++) {
      setTimeout(launchRocket, i * 200);
    }

    // Wave 2: 4 rockets after 0.8s
    setTimeout(() => {
      for (let i = 0; i < 4; i++) {
        setTimeout(launchRocket, i * 150);
      }
    }, 800);

    // Wave 3: 3 rockets after 1.8s
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(launchRocket, i * 200);
      }
    }, 1800);

    // Continuous random rockets for 8 seconds
    let continuousInterval = setInterval(() => {
      if (!fireworksRunning) {
        clearInterval(continuousInterval);
        return;
      }
      launchRocket();
    }, 600);

    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(continuousInterval);
    }, 10000);
  }

  // ============================================
  //  YES BUTTON HANDLER
  // ============================================
  btnYes.addEventListener('click', function () {
    // Prevent double clicks
    btnYes.disabled = true;
    btnNo.disabled = true;

    // 1. Activate the overlay (starts dim animation)
    overlay.classList.add('active');

    // 2. Play firework sound effect
    const fireworkSound = new Audio('assets/firework-sound.m4a');
    fireworkSound.volume = 1.0;
    fireworkSound.loop = true;
    fireworkSound.play().catch(() => {});

    // 3. Launch fireworks sparks
    startFireworks();

    // 3. Play the firework video
    if (fireworkVideo) {
      fireworkVideo.currentTime = 0;
      fireworkVideo.play().catch(() => {});
    }

    // 4. After dim phase completes (~1.2s), hide main content
    setTimeout(() => {
      mainContent.style.opacity = '0';
      mainContent.style.transition = 'opacity 0.4s ease';

      // Pause the video & stop chroma key
      if (valentineVideo) {
        valentineVideo.pause();
        stopChromaKey();
      }

      // Stop fairy animation
      stopFairyAnimation();
    }, 1000);

    // 5. After full animation, remove main content from flow
    setTimeout(() => {
      mainContent.style.display = 'none';
    }, 2500);
  });

  // ============================================
  //  ENSURE VIDEO AUTOPLAY + START CHROMA KEY
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    if (valentineVideo) {
      // Start chroma key once video has enough data
      valentineVideo.addEventListener('playing', startChromaKey);

      // Play muted first (autoplay works muted)
      const playPromise = valentineVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          console.log('Autoplay prevented, waiting for interaction.');
        });
      }

      // Unmute on first user interaction (click/touch anywhere)
      function unmuteOnInteraction() {
        if (valentineVideo.muted) {
          valentineVideo.muted = false;
        }
        // Also ensure video is playing (in case autoplay was blocked)
        if (valentineVideo.paused) {
          valentineVideo.play().then(startChromaKey).catch(() => {});
        }
        document.removeEventListener('click', unmuteOnInteraction);
        document.removeEventListener('touchstart', unmuteOnInteraction);
      }

      document.addEventListener('click', unmuteOnInteraction);
      document.addEventListener('touchstart', unmuteOnInteraction);
    }
  });

  // ============================================
  //  REMOVE SHAKE CLASS AFTER ANIMATION
  // ============================================
  btnNo.addEventListener('animationend', function () {
    btnNo.classList.remove('shake');
  });

})();
