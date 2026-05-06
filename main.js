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

/* ── Mobile hamburger menu ───────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var btn     = document.getElementById('nav-hamburger');
  var overlay = document.getElementById('nav-mobile-overlay');
  if (!btn || !overlay) return;

  function openMenu() {
    btn.classList.add('is-open');
    overlay.style.cssText = 'display:flex;';
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('is-open');
    overlay.style.cssText = 'display:none;';
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', function () {
    btn.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  overlay.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
});
