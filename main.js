/* ── Hide nav on scroll-down, reveal on scroll-up ─── */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var lastY    = 0;
  var ticking  = false;
  var THRESHOLD = 80; /* px scrolled before we start hiding */

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;

      if (y > lastY && y > THRESHOLD) {
        /* scrolling DOWN */
        nav.classList.add('nav--hidden');
      } else if (y < lastY) {
        /* scrolling UP */
        nav.classList.remove('nav--hidden');
      }

      lastY   = y;
      ticking = false;
    });
  });
})();
