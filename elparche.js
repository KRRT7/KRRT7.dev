(function() {
  var root = document.querySelector('.el-parche');
  if (!root) return;

  // ── Toggle ──
  var toggleBtn = root.querySelector('.toggle');
  var toggleLabel = root.querySelector('.toggle-label');
  var toggleIcon = root.querySelector('.toggle-icon');

  function updateToggle() {
    var isNight = root.classList.contains('night');
    toggleLabel.textContent = isNight ? 'Noche' : 'Día';
    toggleIcon.textContent = isNight ? '☾' : '☀';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function() {
      root.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
        revealObserver.observe(el);
      });
    }, 100);
  }

  toggleBtn.addEventListener('click', function() {
    root.classList.toggle('night');
    updateToggle();
  });

  // Auto night mode
  var hour = new Date().getHours();
  if (hour >= 17 || hour < 2) {
    root.classList.add('night');
    toggleLabel.textContent = 'Noche';
    toggleIcon.textContent = '☾';
  }

  // ── Hamburger ──
  var hamburger = root.querySelector('.hamburger');
  var navLinks = root.querySelector('.nav-links');
  hamburger.addEventListener('click', function() {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // ── Scroll reveal with staggered items ──
  root.querySelectorAll('.cat').forEach(function(cat) {
    cat.querySelectorAll('.item').forEach(function(item, i) {
      item.style.transitionDelay = (i * 0.07) + 's';
    });
  });

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  root.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });

  // ── Sticky nav ──
  var nav = root.querySelector('.sticky-nav');
  var hero = root.querySelector('.hero');
  var navObserver = new IntersectionObserver(function(entries) {
    nav.classList.toggle('show', !entries[0].isIntersecting);
  }, { threshold: 0 });
  navObserver.observe(hero);

  // Close mobile menu on link click
  root.querySelectorAll('.nav-links a').forEach(function(a) {
    a.addEventListener('click', function() {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // Active nav link on scroll
  var sections = root.querySelectorAll('[id]');
  var navAnchors = root.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', function() {
    var current = '';
    sections.forEach(function(s) {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navAnchors.forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  // ── Scroll progress + hero parallax + hero fade ──
  var ghostWord = root.querySelector('.hero-bg-word');
  var progressBar = root.querySelector('.scroll-progress');
  var heroEl = root.querySelector('.hero');
  function docHeight() { return document.documentElement.scrollHeight - window.innerHeight; }

  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    progressBar.style.transform = 'scaleX(' + (y / docHeight()) + ')';
    if (y < window.innerHeight) {
      ghostWord.style.transform = 'translate(-50%, calc(-50% + ' + (y * 0.15) + 'px))';
      heroEl.style.opacity = 1 - (y / window.innerHeight) * 0.4;
    }
  }, { passive: true });
})();
