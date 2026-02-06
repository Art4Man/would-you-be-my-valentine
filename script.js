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
  //  YES BUTTON HANDLER
  // ============================================
  btnYes.addEventListener('click', function () {
    // Prevent double clicks
    btnYes.disabled = true;
    btnNo.disabled = true;

    // 1. Activate the overlay (starts dim animation)
    overlay.classList.add('active');

    // 2. Play the firework video
    if (fireworkVideo) {
      fireworkVideo.currentTime = 0;
      fireworkVideo.play().catch(() => {});
    }

    // 3. After dim phase completes (~1.2s), hide main content
    setTimeout(() => {
      mainContent.style.opacity = '0';
      mainContent.style.transition = 'opacity 0.4s ease';

      // Pause the video & stop chroma key
      if (valentineVideo) {
        valentineVideo.pause();
        stopChromaKey();
      }
    }, 1000);

    // 4. After full animation, remove main content from flow
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

      // Attempt to play (catches autoplay rejection on some browsers)
      const playPromise = valentineVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Autoplay was prevented — user will need to interact
          console.log('Autoplay prevented, user interaction required.');
          // Start chroma on first user tap
          document.addEventListener('click', function onFirstClick() {
            valentineVideo.play().then(startChromaKey).catch(() => {});
            document.removeEventListener('click', onFirstClick);
          });
        });
      }
    }
  });

  // ============================================
  //  REMOVE SHAKE CLASS AFTER ANIMATION
  // ============================================
  btnNo.addEventListener('animationend', function () {
    btnNo.classList.remove('shake');
  });

})();
