/* =========================================================
   Efeitos premium da LP de festas — mesma linguagem do site da ergos:
   GSAP + ScrollTrigger + Lenis, curvas "lp-out"/"lp-in",
   revelações com desfoque e abertura com o logo pousando no topo.
   Se o GSAP não carregar, a página continua normal (nada fica escondido).
   ========================================================= */
(function () {
  const raiz = document.documentElement;
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = matchMedia('(hover: none)').matches;

  // ---------- botões com texto que rola (funciona mesmo sem GSAP) ----------
  document.querySelectorAll('.btn').forEach(b => {
    const no = [...b.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!no) return;
    const t = no.textContent.trim();
    const s = document.createElement('span');
    s.className = 'btn__txt'; s.dataset.txt = t; s.textContent = t;
    b.replaceChild(s, no);
  });

  const fim = () => { raiz.classList.add('abertura-fim'); raiz.classList.remove('abertura-on'); document.querySelector('.abertura')?.remove(); };
  if (!window.gsap || !window.ScrollTrigger || reduzido) { window.__efeitos = true; fim(); return; }
  window.__efeitos = true;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const OUT = 'expo.out', IN = 'power3.in';
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---------- rolagem suave (Lenis), só na roda do mouse; toque fica nativo ----------
  let lenis = null;
  if (window.Lenis && !toque) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;
  window.irPara = (alvo, opcoes = {}) => {
    const el = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -16, immediate: !!opcoes.imediato, force: true });
    else el.scrollIntoView({ behavior: opcoes.imediato ? 'auto' : 'smooth' });
  };

  // ---------- véu entre seções (cliques em links #) ----------
  const veu = document.createElement('div');
  veu.className = 'veu'; veu.setAttribute('aria-hidden', 'true');
  document.body.append(veu);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    const alvo = document.querySelector(id);
    if (!alvo) return;
    e.preventDefault();
    gsap.timeline()
      .to(veu, { autoAlpha: 1, duration: 0.22, ease: 'power1.in' })
      .add(() => window.irPara(alvo, { imediato: true }))
      .to(veu, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' }, '+=0.12');
  });

  // ---------- barra fixa depois do topo ----------
  const barra = document.createElement('div');
  barra.className = 'barra';
  const zap = typeof linkZap !== 'undefined' ? linkZap : 'https://wa.me/5573999090909';
  barra.innerHTML = '<a class="btn btn--zap" href="' + zap + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg><span class="btn__txt" data-txt="Falar com um especialista">Falar com um especialista</span></a>';
  barra.querySelector('a').addEventListener('click', () => (window.dataLayer = window.dataLayer || []).push({ event:'clique_especialista' }));
  document.body.append(barra);
  // aparece depois do topo e some quando o formulário de orçamento está na tela
  let passouTopo = false, noForm = false;
  const atualizaBarra = () => barra.classList.toggle('ver', passouTopo && !noForm);
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80%', onEnter: () => { passouTopo = true; atualizaBarra(); }, onLeaveBack: () => { passouTopo = false; atualizaBarra(); } });
  ScrollTrigger.create({ trigger: '#orcamento', start: 'top 75%', end: 'max', onToggle: st => { noForm = st.isActive; atualizaBarra(); } });

  // ---------- topo: título palavra por palavra ----------
  const h1 = document.querySelector('.hero h1');
  h1.innerHTML = h1.textContent.trim().split(/\s+/).map(p => '<span class="palavra">' + p + '</span>').join(' ');
  const palavras = h1.querySelectorAll('.palavra');
  const textosTopo = document.querySelectorAll('.hero .lead, .hero .acoes, .hero .cidades');
  gsap.set(palavras, { autoAlpha: 0, y: 28, filter: 'blur(12px)' });
  gsap.set(textosTopo, { autoAlpha: 0, y: 18, filter: 'blur(8px)' });
  const entrarTopo = () => {
    gsap.to(palavras, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: OUT, stagger: 0.06 });
    gsap.to(textosTopo, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: OUT, stagger: 0.1, delay: 0.35 });
  };

  // topo vira "cartão": encolhe com cantos arredondados enquanto a foto desce mais devagar
  const hero = document.querySelector('.hero');
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .fromTo(hero, { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      { clipPath: () => `inset(0px ${innerWidth < 760 ? 10 : 28}px 60px ${innerWidth < 760 ? 10 : 28}px round 28px)`, ease: 'none' }, 0)
    .to('.hero-foto', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
    .to('.hero-corpo', { y: -60, autoAlpha: 0, filter: 'blur(10px)', ease: 'none' }, 0.15);

  // ---------- faixa infinita, acelera com a velocidade da rolagem ----------
  const trilho = document.querySelector('.faixa__trilho');
  if (trilho) {
    let x = 0, larg = trilho.firstElementChild.offsetWidth, ultimoY = scrollY, vel = 0;
    addEventListener('resize', () => { larg = trilho.firstElementChild.offsetWidth; });
    gsap.ticker.add((tempo, dt) => {
      const y = lenis ? lenis.scroll : scrollY;
      const v = lenis ? Math.abs(lenis.velocity) : Math.abs(y - ultimoY);
      ultimoY = y; vel += (v - vel) * 0.1;
      x -= (60 + Math.min(vel, 60) * 9) * (dt / 1000);
      if (x <= -larg) x += larg;
      trilho.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  }

  // ---------- revelações com desfoque ao entrar na tela ----------
  const revela = (alvos, extra = {}) => {
    gsap.utils.toArray(alvos).forEach(el => {
      gsap.fromTo(el, { autoAlpha: 0, y: 28, filter: 'blur(12px)' }, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: OUT, ...extra,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  };
  const revelaGrupo = (pai, filhos, extra = {}) => {
    gsap.utils.toArray(pai).forEach(p => {
      const f = p.querySelectorAll(filhos);
      if (!f.length) return;
      gsap.fromTo(f, { autoAlpha: 0, y: 32, filter: 'blur(12px)' }, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: OUT, stagger: 0.1, ...extra,
        scrollTrigger: { trigger: p, start: 'top 85%', once: true }
      });
    });
  };
  revela('main h2, main .lead, .grupo-titulo, .alt-zap, .insta .arroba, .insta p:not(.arroba)');
  revelaGrupo('.publicos', '.publico');
  revelaGrupo('.passos', 'li');
  revelaGrupo('.feed', 'a', { stagger: 0.06 });
  revelaGrupo('.depo-lista', '.depo-card');
  revelaGrupo('#form', '.campo, fieldset, .enviar', { stagger: 0.05 });

  // catálogo: cada linha entra e a foto se abre de baixo para cima
  gsap.utils.toArray('.rider li').forEach(li => {
    const foto = li.querySelector('.foto');
    const resto = li.querySelectorAll('.nome, .desc, .uso');
    const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 85%', once: true } });
    if (foto) tl.fromTo(foto, { clipPath: 'inset(100% 0% 0% 0% round 12px)', scale: 1.12 },
      { clipPath: 'inset(0% 0% 0% 0% round 12px)', scale: 1, duration: 1.2, ease: 'expo.inOut' }, 0);
    tl.fromTo(resto, { autoAlpha: 0, y: 20, filter: 'blur(10px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: OUT, stagger: 0.08 }, 0.25);
  });

  // foto com pontos: a foto se abre e os pontos aparecem um a um
  const tlPontos = gsap.timeline({ scrollTrigger: { trigger: '.explorar', start: 'top 80%', once: true } });
  tlPontos.fromTo('.explorar-foto', { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.3, ease: 'expo.inOut' })
    .fromTo('.ponto', { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.15, clearProps: 'transform' }, '-=0.3')
    .fromTo('.explorar-painel, .explorar-dica', { autoAlpha: 0, y: 24, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: OUT }, '-=0.8');

  // calendário: dias acendem em sequência
  gsap.fromTo('.dias button', { autoAlpha: 0, scale: 0.6 }, {
    autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.018, from: 'start' },
    scrollTrigger: { trigger: '.calendario', start: 'top 80%', once: true },
    clearProps: 'transform'
  });

  // galeria de eventos: fotos entram uma a uma
  gsap.fromTo('.gal-item', { autoAlpha: 0, y: 40, scale: 0.94 }, {
    autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: OUT, stagger: 0.08, clearProps: 'transform',
    scrollTrigger: { trigger: '.gal-trilho', start: 'top 85%', once: true }
  });

  // ---------- abertura: logo surge com brilho, se revela e pousa no topo ----------
  const abertura = document.querySelector('.abertura');
  if (!abertura || !raiz.classList.contains('abertura-on')) { fim(); entrarTopo(); return; }
  const logo = abertura.querySelector('.abertura__logo');
  const brilho = abertura.querySelector('.abertura__brilho');
  const destino = document.querySelector('.topo .marca img');
  lenis?.stop(); scrollTo(0, 0);
  const pronto = Promise.race([
    Promise.all([document.fonts?.ready, document.querySelector('.hero-foto')?.decode?.()].map(p => Promise.resolve(p).catch(() => {}))),
    new Promise(r => setTimeout(r, 2500))
  ]);
  gsap.set(logo, { '--revela': '-20%', filter: 'blur(8px)', autoAlpha: 1, scale: 1.04 });
  gsap.set(brilho, { scale: 0.4 });
  const tl = gsap.timeline();
  tl.to(brilho, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 0)
    .to(logo, { '--revela': '125%', filter: 'blur(0px)', scale: 1, duration: 1.1, ease: 'power2.out' }, 0.15);
  Promise.all([pronto, tl.then()]).then(() => {
    const a = logo.getBoundingClientRect(), b = destino.getBoundingClientRect();
    gsap.timeline({ delay: 0.1, onComplete: () => { fim(); lenis?.start(); ScrollTrigger.refresh(); } })
      .to(brilho, { autoAlpha: 0, duration: 0.5 }, 0)
      .to(logo, { x: b.left - a.left, y: b.top - a.top, scale: b.width / a.width, duration: 1, ease: 'expo.inOut' }, 0)
      .to(abertura, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.9, ease: 'power2.inOut' }, 0.25)
      .fromTo('.hero-foto', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 0.2)
      .add(entrarTopo, 0.45);
  });
})();
