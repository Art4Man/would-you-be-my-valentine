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

      // Pause the video
      if (valentineVideo) {
        valentineVideo.pause();
      }
    }, 1000);

    // 4. After full animation, remove main content from flow
    setTimeout(() => {
      mainContent.style.display = 'none';
    }, 2500);
  });

  // ============================================
  //  ENSURE VIDEO AUTOPLAY (iOS fallback)
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    if (valentineVideo) {
      // Attempt to play (catches autoplay rejection on some browsers)
      const playPromise = valentineVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Autoplay was prevented — user will need to interact
          // Video will still show first frame via preload="metadata"
          console.log('Autoplay prevented, user interaction required.');
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
