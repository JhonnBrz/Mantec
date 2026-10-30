/* MANTEC — interações e movimento */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = matchMedia('(min-width: 1024px)');
  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  const animate = hasGSAP && !reduceMotion;
  const hdrH = () => parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 68;

  let lenis = null;
  const scrollToY = (y, smooth = true) => {
    if (lenis) lenis.scrollTo(y, smooth ? { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) } : { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  };

  /* Marquee de clientes: duplica cada linha para o loop contínuo ---------- */
  $$('[data-logos]').forEach((row) => {
    const set = $('.logos__set', row);
    const clone = set.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    $$('img', clone).forEach((img) => { img.alt = ''; img.removeAttribute('role'); });
    row.appendChild(clone);
  });

  /* Menu mobile ---------------------------------------------------------- */
  const burger = $('.hdr__burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
  });
  desktop.addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Âncoras -------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) setMenu(false);
    const y = id === '#topo' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    scrollToY(y);
    history.replaceState(null, '', id === '#topo' ? location.pathname : id);
  });

  /* Serviços (desktop): módulo fixo que avança com o scroll -------------- */
  const svcx = $('[data-svcx]');
  const svcxBtns = $$('[data-svcx-go]');
  const svcxImgs = $$('.svcx__frame img');
  const svcxPanels = $$('.svcx__panel');
  const svcxBar = $('[data-svcx-bar]');
  const svcxCount = svcxPanels.length;
  let svcxCur = 0;

  // Ordem de entrada em cascata de cada linha do painel
  svcxPanels.forEach((panel) => {
    let i = 0;
    Array.from(panel.children).forEach((child) => {
      child.style.setProperty('--i', i++);
      if (child.matches('.svcx__specs')) $$('li', child).forEach((li) => li.style.setProperty('--i', i++));
    });
  });

  // Bloco escuro que desliza entre os itens do menu
  const svcxNav = $('.svcx__nav');
  const svcxInd = document.createElement('span');
  svcxInd.className = 'svcx__ind';
  svcxInd.setAttribute('aria-hidden', 'true');
  if (svcxNav) svcxNav.prepend(svcxInd);
  const placeInd = () => {
    const btn = svcxBtns[svcxCur];
    if (!btn || !btn.offsetHeight) return;
    svcxInd.style.height = `${btn.offsetHeight}px`;
    svcxInd.style.transform = `translateY(${btn.parentElement.offsetTop}px)`;
  };

  const setSvcx = (i) => {
    if (i === svcxCur) return;
    svcxImgs.forEach((im) => im.classList.remove('is-prev'));
    svcxImgs[svcxCur].classList.remove('is-active');
    svcxImgs[svcxCur].classList.add('is-prev');
    svcxImgs[i].classList.add('is-active');
    svcxPanels[svcxCur].classList.remove('is-active');
    svcxPanels[i].classList.add('is-active');
    svcxBtns[svcxCur].classList.remove('is-active');
    svcxBtns[i].classList.add('is-active');
    svcxCur = i;
    placeInd();
  };
  placeInd();
  window.addEventListener('resize', placeInd);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInd);
  const svcxRange = () => {
    const top = svcx.getBoundingClientRect().top + window.scrollY - hdrH();
    const total = svcx.offsetHeight - (window.innerHeight - hdrH());
    return { top, total };
  };
  const svcxUpdate = () => {
    if (!svcx || !desktop.matches) return;
    const { top, total } = svcxRange();
    const p = clamp((window.scrollY - top) / total, 0, 0.9999);
    setSvcx(Math.floor(p * svcxCount));
    svcxBar.style.transform = `scaleX(${p})`;
  };
  svcxBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const { top, total } = svcxRange();
      scrollToY(top + ((i + 0.5) / svcxCount) * total);
    });
  });

  /* Cabeçalho, progresso e botão flutuante ------------------------------- */
  const hdr = $('[data-hdr]');
  const fab = $('[data-fab]');
  const bar = $('.progress__bar');
  const contato = $('#contato');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    hdr.classList.toggle('is-solid', y > 24);
    if (!root.classList.contains('menu-open')) {
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > vh * 0.6) hdr.classList.add('is-hidden');
      else if (goingUp || y < vh * 0.6) hdr.classList.remove('is-hidden');
    }

    const nearContact = contato.getBoundingClientRect().top < vh * 0.9;
    fab.classList.toggle('is-on', y > vh * 0.75 && !nearContact);

    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    svcxUpdate();
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Link ativo no menu --------------------------------------------------- */
  const navLinks = $$('.hdr__nav a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = '#' + en.target.id;
      navLinks.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['topo', 'empresa', 'estrutura', 'servicos', 'obras', 'clientes', 'proposito', 'contato']
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach((s) => navIO.observe(s));

  /* Serviços (celular e tablet): acordeão -------------------------------- */
  const svcItems = $$('[data-svc]');
  svcItems.forEach((item) => {
    const head = $('.svc__head', item);
    head.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      svcItems.forEach((other) => {
        other.classList.toggle('is-open', other === item && willOpen);
        $('.svc__head', other).setAttribute('aria-expanded', String(other === item && willOpen));
      });
      // Mantém o título tocado parado na tela enquanto os itens abrem e fecham
      const startTop = head.getBoundingClientRect().top;
      const until = performance.now() + 700;
      const anchor = () => {
        const drift = head.getBoundingClientRect().top - startTop;
        if (Math.abs(drift) > 0.5) scrollToY(window.scrollY + drift, false);
        if (performance.now() < until) requestAnimationFrame(anchor);
        else if (window.ScrollTrigger) ScrollTrigger.refresh();
      };
      requestAnimationFrame(anchor);
    });
  });

  /* Obras: painel lateral acompanha a linha em foco ou sob o cursor ------- */
  const works = $$('[data-work]');
  const workImgs = $$('.works__frame img');
  const workNum = $('[data-work-num]');
  const workCat = $('[data-work-cat]');
  let workCurrent = -1;
  const setWork = (i) => {
    if (i === workCurrent || i < 0) return;
    const prev = workCurrent;
    workImgs.forEach((im) => im.classList.remove('is-prev'));
    if (prev >= 0) {
      workImgs[prev].classList.remove('is-active');
      workImgs[prev].classList.add('is-prev');
      works[prev].classList.remove('is-active');
    }
    workImgs[i].classList.add('is-active');
    works[i].classList.add('is-active');
    workNum.textContent = String(i + 1).padStart(2, '0');
    workCat.textContent = $('.work__cat', works[i]).textContent;
    workCurrent = i;
  };
  if (works.length) {
    workImgs.forEach((im) => im.classList.remove('is-active'));
    const workIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setWork(works.indexOf(en.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    works.forEach((w, i) => {
      workIO.observe(w);
      if (finePointer) w.addEventListener('pointerenter', () => setWork(i));
    });
    setWork(0);
  }

  /* Emblema 3D do hero (desktop) ----------------------------------------- */
  const emblem = { assemble: reduceMotion ? 1 : 0, scroll: 0 };
  const initEmblem = () => {
    const canvas = $('[data-emblem]');
    if (!canvas || !desktop.matches) return false;
    if (!window.THREE) { root.classList.add('no-webgl'); return false; }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      root.classList.add('no-webgl');
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 1000);
    camera.position.set(0, 0, 250);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9690, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-80, 110, 140);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff4d6, 0.9);
    fill.position.set(120, -20, 80);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(60, 40, -120);
    scene.add(rim);

    // Mesmas formas do emblema da logo (coordenadas do SVG, eixo Y invertido)
    const shape = (pts) => {
      const s = new THREE.Shape();
      pts.forEach(([x, y], i) => (i ? s.lineTo(x - 39, 33.5 - y) : s.moveTo(x - 39, 33.5 - y)));
      s.closePath();
      return s;
    };
    const defs = {
      beam: [[0, 0], [78, 0], [78, 5], [0, 5]],
      wedge: [[28, 5], [50, 5], [39, 36]],
      left: [[16, 32], [31.5, 62], [32.5, 62], [32.5, 67], [0, 67], [0, 62], [16, 62]],
      right: [[62, 32], [62, 62], [78, 62], [78, 67], [45.5, 67], [45.5, 62], [46.5, 62]],
    };
    const depth = 10;
    const extrude = { depth, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.55, bevelSegments: 3, curveSegments: 1 };
    const capMat = new THREE.MeshStandardMaterial({ color: 0xfedd2e, roughness: 0.34, metalness: 0.18 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xc99a06, roughness: 0.46, metalness: 0.28 });
    const group = new THREE.Group();
    const parts = {};
    Object.keys(defs).forEach((k) => {
      const g = new THREE.ExtrudeGeometry(shape(defs[k]), extrude);
      g.translate(0, 0, -depth / 2);
      const m = new THREE.Mesh(g, [capMat, sideMat]);
      group.add(m);
      parts[k] = m;
    });
    scene.add(group);

    // Deslocamentos: montagem (entrada) e vista explodida (scroll)
    const apart = { beam: [0, 42, 30], wedge: [0, 28, 18], left: [-34, -20, 22], right: [34, -20, 22] };
    const explode = { beam: [0, 13, 6], wedge: [0, 5, 3], left: [-8, -6, 4], right: [8, -6, 4] };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Garante que o emblema caiba com folga em qualquer proporção
      const fitH = 96 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const fitW = 120 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      camera.position.z = Math.max(fitH, fitW);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(canvas);
    resize();

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (finePointer) {
      window.addEventListener('pointermove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

    const t0 = performance.now();
    let last = t0;
    let sSmooth = emblem.scroll;
    const render = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      // Amortecimento independente da taxa de quadros (60, 120 ou 144 Hz)
      const k = 1 - Math.pow(0.001, Math.min(0.05, (now - last) / 1000));
      last = now;
      mouse.x += (mouse.tx - mouse.x) * k * 0.9;
      mouse.y += (mouse.ty - mouse.y) * k * 0.9;
      sSmooth += (emblem.scroll - sSmooth) * k;
      const a = 1 - emblem.assemble;
      const s = sSmooth;
      Object.keys(parts).forEach((k) => {
        const p = parts[k];
        p.position.set(
          apart[k][0] * a + explode[k][0] * s,
          apart[k][1] * a + explode[k][1] * s,
          apart[k][2] * a + explode[k][2] * s,
        );
      });
      const idle = reduceMotion ? 0 : 1;
      group.rotation.y = -0.42 + Math.sin(t * 0.45) * 0.22 * idle + mouse.x * 0.35 + s * 0.9 - a * 0.9;
      group.rotation.x = -0.16 + Math.sin(t * 0.6) * 0.05 * idle + mouse.y * 0.18 + s * 0.25;
      group.rotation.z = Math.sin(t * 0.35) * 0.02 * idle;
      group.position.y = Math.sin(t * 0.8) * 1.2 * idle;
      renderer.render(scene, camera);
    };

    if (reduceMotion) {
      render();
      window.addEventListener('resize', () => requestAnimationFrame(render));
    } else {
      const loop = () => {
        if (visible) render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    return true;
  };
  const emblemOn = initEmblem();

  /* Sem animação: mostra tudo e encerra ---------------------------------- */
  if (!animate) {
    root.classList.remove('js');
    return;
  }

  /* ======================================================================
     Movimento (GSAP + ScrollTrigger + Lenis)
     ====================================================================== */
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    gsap.defaults({ ease: 'expo.out' });

    // Só divide textos em letras/linhas quando a fonte já carregou (sem deslocamentos)
    const fontsReady = new Promise((resolve) => {
      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('600 1em Archivo'),
          document.fonts.load('400 1em Archivo'),
        ]).then(() => document.fonts.ready).then(resolve, resolve);
      } else {
        resolve();
      }
      setTimeout(resolve, 2000);
    });

    /* Hero: entrada letra por letra, girando em 3D ---------------------- */
    const startIntro = () => {
      const heroLines = $$('.hero__name .ln > span');
      const heroChars = [];
      heroLines.forEach((line) => {
        const split = SplitText.create(line, { type: 'chars', charsClass: 'ch' });
        heroChars.push(...split.chars);
      });
      gsap.set(heroChars, { yPercent: 115, rotateX: -88, opacity: 0 });
      gsap.set(heroLines, { y: 0, yPercent: 0 });

      const intro = gsap.timeline();
      intro
        .to(heroChars, {
          yPercent: 0, rotateX: 0, opacity: 1,
          duration: 1.8, stagger: { each: 0.07, from: 'start' }, ease: 'expo.out',
        }, 0)
        .to('[data-intro]', { opacity: 1, y: 0, duration: 1.4, stagger: 0.1 }, 0.45)
        .to('.hero__hazard', { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'expo.inOut' }, 0.25)
        .to('.hero__canvas', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
        .to(emblem, { assemble: 1, duration: 2.6, ease: 'expo.out' }, 0.3);
    };
    fontsReady.then(startIntro);

    /* Hero: nome se afasta e o emblema explode ao rolar ---------------- */
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      .to('.hero__name', { yPercent: -18, ease: 'none' }, 0)
      .to('.hero__hazard', { xPercent: 8, ease: 'none' }, 0)
      .to(emblem, { scroll: 1, ease: 'none' }, 0);

    /* Faixa: loop com aceleração pela velocidade do scroll -------------- */
    const band = $('[data-band]');
    if (band) {
      const sets = $$('.band__set', band);
      const original = sets[0].innerHTML;
      while (sets[0].offsetWidth < window.innerWidth * 1.1) {
        sets.forEach((s) => { s.insertAdjacentHTML('beforeend', original); });
      }
      const bandTween = gsap.to(band, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 6);
          gsap.to(bandTween, {
            timeScale: boost, duration: 0.2, overwrite: true,
            onComplete: () => gsap.to(bandTween, { timeScale: 1, duration: 1.2, ease: 'power2.out' }),
          });
        },
      });
    }

    /* Títulos: faixa zebrada passa por cima e revela cada linha --------- */
    fontsReady.then(() => $$('[data-wipe]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        linesClass: 'wipe-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          // O texto de cada linha vai num recorte que acompanha a faixa zebrada
          const rows = self.lines.map((line) => {
            const txt = document.createElement('span');
            txt.className = 'wipe-txt';
            while (line.firstChild) txt.appendChild(line.firstChild);
            line.appendChild(txt);
            const barEl = document.createElement('span');
            barEl.className = 'wipe-bar';
            line.appendChild(barEl);
            return { txt, barEl };
          });
          const paint = (row, p) => {
            // p: 0 → 1. A faixa atravessa a linha e o texto aparece logo atrás dela
            const edge = clamp(p * 2 - 1, -1, 1);
            row.barEl.style.transform = `translateX(${edge * 101}%)`;
            row.txt.style.clipPath = `inset(-.2em ${(1 - clamp(edge, 0, 1)) * 100}% -.2em 0)`;
          };
          if (el.dataset.wiped) {
            rows.forEach((r) => paint(r, 1));
            return undefined;
          }
          rows.forEach((r) => paint(r, 0));
          if (el._wipeST) el._wipeST.kill();
          const tl = gsap.timeline({ paused: true, onComplete: () => { el.dataset.wiped = '1'; } });
          rows.forEach((row, i) => {
            const st = { p: 0 };
            tl.to(st, {
              p: 1, duration: 1.4, ease: 'power2.inOut',
              onUpdate: () => paint(row, st.p),
            }, i * 0.14);
          });
          el._wipeST = ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
          return undefined;
        },
      });
    }));

    /* Fotos: recorte abre, imagem desliza e a cor surge ----------------- */
    // Tudo por transform/opacity: a cópia em P&B só some (sem repintar a foto)
    $$('[data-photo]').forEach((fig) => {
      const frame = $('.photo__frame', fig);
      const img = $('img', frame);
      const inner = document.createElement('div');
      inner.className = 'photo__inner';
      frame.insertBefore(inner, img);
      inner.appendChild(img);
      const gray = img.cloneNode();
      gray.alt = '';
      gray.setAttribute('aria-hidden', 'true');
      gray.classList.add('photo__gray');
      inner.appendChild(gray);

      gsap.fromTo(frame, { clipPath: 'inset(14% 10% 14% 10%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out',
        scrollTrigger: { trigger: fig, start: 'top 98%', end: 'top 38%', scrub: 1 },
      });
      gsap.fromTo(gray, { opacity: 1 }, {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top 72%', end: 'center 48%', scrub: 1 },
      });
      gsap.fromTo(inner, { yPercent: -5, scale: 1.14 }, {
        yPercent: 5, scale: 1, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    });

    /* Elementos que sobem em sequência ---------------------------------- */
    ScrollTrigger.batch('[data-rise]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0, duration: 1.6, stagger: 0.1, ease: 'expo.out', overwrite: true,
      }),
    });

    /* Contadores --------------------------------------------------------- */
    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => gsap.to(o, {
          v: end, duration: 2, ease: 'expo.out',
          onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('pt-BR'); },
        }),
      });
    });

    /* Botões magnéticos -------------------------------------------------- */
    if (finePointer) {
      $$('[data-magnetic]').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    if (!emblemOn) gsap.set('.hero__canvas', { opacity: 1 });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  } catch (err) {
    console.error(err);
    if (lenis) { lenis.destroy(); lenis = null; }
    root.classList.remove('js');
    emblem.assemble = 1;
    if (window.gsap) {
      gsap.set('[data-intro], [data-rise], [data-wipe], .hero__name .ln > span, .hero__name .ch, .hero__hazard, .hero__canvas', { clearProps: 'all' });
    }
  }
})();
