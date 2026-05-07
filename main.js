/* ── Hide nav on scroll-down, reveal on scroll-up ─── */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var lastY    = 0;
  var ticking  = false;
  var THRESHOLD = 80;

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > lastY && y > THRESHOLD) {
        nav.classList.add('nav--hidden');
      } else if (y < lastY) {
        nav.classList.remove('nav--hidden');
      }
      lastY   = y;
      ticking = false;
    });
  });
})();

/* Hamburger is handled inline per-page — nothing here */
