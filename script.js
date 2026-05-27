/* =========================================================
   Anton Evstifeev — portfolio
   GSAP + ScrollTrigger + Lenis
   ========================================================= */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const isMobile = () => window.matchMedia('(max-width: 921px)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* ---------- Hero intro timeline ---------- */
  const heroBg = document.querySelector('.hero__bg');
  const heroVideo = document.querySelector('.hero__video');
  const heroWrapper = document.querySelector('.hero__wrapper');
  const heroCaption = document.querySelector('.hero__caption');

  if (heroBg && heroVideo && heroWrapper) {
    const revealHero = () => {
      gsap.set(heroWrapper, { scale: 1 });
      gsap.set(heroVideo, { scale: 1 });
      gsap.set(heroBg, { height: '100%' });
      if (heroCaption) gsap.set(heroCaption, { opacity: 1 });
    };

    gsap.set(heroWrapper, { scale: 1 });
    gsap.set(heroVideo, { scale: 1 });
    gsap.set(heroBg, { height: 0 });
    if (heroCaption) gsap.set(heroCaption, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: revealHero,
    });

    tl.to(heroBg, { height: '100%', duration: 0.6, ease: 'power1.out' }, 0.4)
      .fromTo(heroWrapper, { scale: 0.85, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.7 }, 0.5)
      .to(heroCaption, { opacity: 1, duration: 0.4 }, 1.0);

    setTimeout(revealHero, 4000);
  }

  /* ---------- Project reveal on scroll ---------- */
  const projects = document.querySelectorAll('.project');
  projects.forEach((el) => el.classList.add('reveal'));

  projects.forEach((el, index) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      onEnter: () => {
        gsap.delayedCall((index % 4) * 0.04, () =>
          el.classList.add('is-revealed')
        );
      },
      once: true,
    });
  });

  /* ---------- About text-reveal ---------- */
  const aboutBodies = document.querySelectorAll('.about__body');
  aboutBodies.forEach((aboutBody) => {
    ScrollTrigger.create({
      trigger: aboutBody,
      start: 'top 80%',
      onEnter: () => aboutBody.classList.add('is-revealed'),
      once: true,
    });
  });

  /* ---------- Hover-video (cursor-following preview) ---------- */
  const hoverVideo = document.getElementById('hoverVideo');
  const hoverVideoImg = document.getElementById('hoverVideoImg');
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let isHovering = false;
  let activeProject = null;
  let activeImages = [];
  let activeImageIndex = -1;
  let scrubStartX = 0;
  const preloaded = new Set();
  const HOVER_FOLLOW_SPEED = 0.58;
  const PREVIEW_OFFSET_X = 18;
  const PREVIEW_OFFSET_Y = -6;
  const PIXELS_PER_FRAME = 24;

  function lerp(a, b, n) {
    return a + (b - a) * n;
  }

  function getProjectImages(project) {
    const raw =
      project.getAttribute('data-images') ||
      project.dataset.images ||
      project.getAttribute('data-image') ||
      project.dataset.image;
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function preloadImages(urls) {
    urls.forEach((src) => {
      if (preloaded.has(src)) return;
      preloaded.add(src);
      const img = new Image();
      img.src = src;
    });
  }

  function resolveSrc(src) {
    try {
      return new URL(src, window.location.href).pathname;
    } catch {
      return src;
    }
  }

  function setPreviewImage(src) {
    if (!hoverVideoImg || !src) return;
    const current = resolveSrc(hoverVideoImg.src);
    const next = resolveSrc(src);
    if (current === next) return;
    hoverVideoImg.classList.add('is-switching');
    hoverVideoImg.src = src;
    requestAnimationFrame(() => hoverVideoImg.classList.remove('is-switching'));
  }

  function getPreviewCoords(clientX, clientY) {
    if (!hoverVideo) return { x: clientX, y: clientY };
    const w = hoverVideo.offsetWidth || 320;
    const h = hoverVideo.offsetHeight || 180;
    const orientation = hoverVideo.dataset.orientation || 'left';
    return {
      x:
        orientation === 'right'
          ? clientX - w - PREVIEW_OFFSET_X
          : clientX + PREVIEW_OFFSET_X,
      y: clientY - h / 2 + PREVIEW_OFFSET_Y,
    };
  }

  function updatePreviewFromCursor(clientX) {
    if (!activeImages.length) return;

    const travel = clientX - scrubStartX;
    const index = Math.min(
      activeImages.length - 1,
      Math.max(0, Math.floor(Math.abs(travel) / PIXELS_PER_FRAME))
    );

    if (index === activeImageIndex) return;
    activeImageIndex = index;
    setPreviewImage(activeImages[index]);
  }

  function updateHoverPos() {
    if (!hoverVideo) return;
    targetX = lerp(targetX, mouseX, HOVER_FOLLOW_SPEED);
    targetY = lerp(targetY, mouseY, HOVER_FOLLOW_SPEED);
    if (isHovering) {
      hoverVideo.style.setProperty('--hv-x', `${targetX}px`);
      hoverVideo.style.setProperty('--hv-y', `${targetY}px`);
    }
    requestAnimationFrame(updateHoverPos);
  }
  updateHoverPos();

  window.addEventListener('mousemove', (e) => {
    if (isMobile()) return;
    const coords = getPreviewCoords(e.clientX, e.clientY);
    mouseX = coords.x;
    mouseY = coords.y;

    if (activeProject) {
      updatePreviewFromCursor(e.clientX);
    }
  });

  projects.forEach((project) => {
    project.addEventListener('mouseenter', (e) => {
      if (isMobile() || !hoverVideo) return;
      const orient = project.dataset.orientation || 'left';
      const images = getProjectImages(project);
      hoverVideo.dataset.orientation = orient;
      preloadImages(images);
      activeImages = images;
      activeProject = project;
      isHovering = true;
      scrubStartX = e.clientX;
      activeImageIndex = 0;
      if (hoverVideoImg) {
        hoverVideoImg.alt = project.querySelector('.project__title')?.textContent || '';
      }
      setPreviewImage(images[0]);
      const coords = getPreviewCoords(e.clientX, e.clientY);
      targetX = coords.x;
      targetY = coords.y;
      hoverVideo.classList.add('is-visible');
      project.classList.add('is-hot');
    });

    project.addEventListener('mouseleave', () => {
      if (isMobile() || !hoverVideo) return;
      isHovering = false;
      activeProject = null;
      activeImages = [];
      activeImageIndex = -1;
      hoverVideo.classList.remove('is-visible');
      project.classList.remove('is-hot');
    });
  });

  /* ---------- Burger menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    const closeMenu = () => {
      burger.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      lenis.start();
    };

    const openMenu = () => {
      burger.classList.add('is-open');
      mobileMenu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      lenis.stop();
    };

    burger.addEventListener('click', () => {
      if (burger.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    mobileMenu.querySelectorAll('.header__mobile-link').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  /* ---------- Resize handling ---------- */
  let lastIsMobile = isMobile();
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (nowMobile !== lastIsMobile) {
      lastIsMobile = nowMobile;
      if (nowMobile && hoverVideo) {
        hoverVideo.classList.remove('is-visible');
        isHovering = false;
        activeProject = null;
        activeImages = [];
      }
    }
    ScrollTrigger.refresh();
  });

  /* ---------- Project click → open detail page ---------- */
  document.querySelectorAll('.project').forEach((project) => {
    if (project.tagName.toLowerCase() === 'a') return;
    project.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      window.location.href = 'project.html';
    });
  });

  /* ---------- Project page: gallery + feature reveals ---------- */
  document
    .querySelectorAll('.project-gallery__item, .project-feature__media')
    .forEach((el, index) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          gsap.delayedCall((index % 3) * 0.08, () =>
            el.classList.add('is-revealed')
          );
        },
        once: true,
      });
    });

  /* ---------- Sound-on toggle (visual state only) ---------- */
  const soundOn = document.getElementById('soundOn');
  if (soundOn) {
    soundOn.addEventListener('click', () => {
      const muted = soundOn.classList.toggle('is-muted');
      soundOn.setAttribute('aria-pressed', String(!muted));
      soundOn.querySelector('.sound-on__label').textContent = muted
        ? 'SOUND OFF'
        : 'SOUND ON';
    });
  }

  /* ---------- Refresh ScrollTrigger after fonts load ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
