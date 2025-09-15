gsap.registerPlugin(ScrollTrigger);

// Timeline do stage:
// - pin ativo entre start e end
// - Fase A: shelf sobe até o dock e PARA
// - “hold” (tempo morto) enquanto o usuário dá mais scroll
// - Fase B: macbook + finder + shelf sobem juntos e saem da tela
const tl = gsap.timeline({
  defaults: { ease: "power2.out" },
  scrollTrigger: {
    trigger: "#stage",
    start: "top top",
    end: "+=1000vh",   // comprimento total da cena (ajuste fino)
    scrub: true,
    pin: true,
    anticipatePin: 1
  }
});

// Fase A — shelf sobe até encostar
tl.to(".dropu-shelf", { y: 0, duration: 0.35 }, 0);

// “Hold” (a shelf fica parada enquanto o usuário ainda rola um pouco)
// Como scrub não aceita pause, usamos um tween “vazio” para criar intervalo.
tl.to({}, { duration: 0.35 }, ">");

// Fase B — tudo sobe JUNTO e sai da tela
const raiseAmount = -0; // % do próprio box (ajuste até sumir com elegância)
tl.to([".macbook-frame", ".finder-window", ".dropu-shelf"], {
  yPercent: raiseAmount,
  duration: 0.8
}, ">");

// Dicas de ajuste fino:
// - A sensação de “encaixe” depende do alinhamento visual entre .finder-window e .dropu-shelf.
//   Garanta mesma left/width e um top da shelf que fique logo sob a base da janela.
// - Ajuste end/durations para calibrar a distância de scroll de cada fase.

 gsap.registerPlugin(Flip);

  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    const slider = document.getElementById("filesSlider");

    function rotateStack() {
      // estado antes de mexer no DOM
      const state = Flip.getState(".files-slider .file");

      // mover o último para a frente (efeito carrossel)
      const last = slider.lastElementChild;
      slider.insertBefore(last, slider.firstElementChild);

      // animar as mudanças de posição
      Flip.from(state, {
        targets: ".files-slider .file",
        duration: 0.1,
        ease: "sine.inOut",
        absolute: true,
        stagger: 0.02,
        onEnter: (els) => gsap.from(els, { yPercent: 20, opacity: 0, ease: "expo.out", duration: 0.6 }),
        onLeave: (els) => gsap.to(els, {
          yPercent: 20, xPercent: -18, opacity: 0,
          transformOrigin: "bottom left",
          ease: "expo.out", duration: 0.6
        })
      });
    }

    // clique para avançar
    slider.addEventListener("click", rotateStack);

    // opcional: auto-loop a cada 2.5s
    // const loop = setInterval(rotateStack, 2500);
    // slider.addEventListener("mouseenter", () => clearInterval(loop));
  });

  // mobile: garante que não fique resíduo de animação
  mm.add("(max-width: 991.98px)", () => {
    gsap.killTweensOf(".files-slider .file");
  });




// feedback real de clique + suporte a teclado para as keycaps
// Keycaps: feedback real + reconhecimento dinâmico (macOS modifiers)
(function () {
  const scope = document.querySelector('.section-shortcut') || document;
  const keycaps = [...scope.querySelectorAll('.keycap')];
  if (!keycaps.length) return;

  // Lê o "rótulo" da tecla: usa data-combo, senão o texto da .legend
  const getLabel = (el) =>
    (el.dataset.combo || el.querySelector('.legend')?.textContent || '')
      .trim();

  // Predicados para os modificadores do macOS
  const MOD = {
    '⌘': (e) => e.metaKey || e.key === 'Meta',
    '⌥': (e) => e.altKey  || e.key === 'Alt',
    '⇧': (e) => e.shiftKey|| e.key === 'Shift',
    '⌃': (e) => e.ctrlKey || e.key === 'Control'
  };

  // Compara um evento com um rótulo (símbolo ou caractere)
  const matches = (label, e) => {
    if (!label) return false;
    // Se for um modificador conhecido, usa o predicado
    if (MOD[label]) return MOD[label](e);
    // Caso contrário, compara a tecla "pura" (Z, C, V, etc.)
    return (e.key || '').toUpperCase() === label.toUpperCase();
  };

  // Helpers de UI/ARIA
  const setPressed = (el, on) => {
    el.classList.toggle('is-pressed', !!on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  // Mouse/Touch
  keycaps.forEach((k) => {
    k.addEventListener('mousedown', () => setPressed(k, true));
    k.addEventListener('mouseup',   () => setPressed(k, false));
    k.addEventListener('mouseleave',() => setPressed(k, false));
    k.addEventListener('touchstart',() => setPressed(k, true), { passive: true });
    k.addEventListener('touchend',  () => setPressed(k, false));
    // acessibilidade inicial
    if (!k.hasAttribute('aria-pressed')) k.setAttribute('aria-pressed', 'false');
    if (!k.hasAttribute('aria-label'))   k.setAttribute('aria-label', `Key ${getLabel(k)}`);
  });

  // Teclado físico: acende a(s) tecla(s) que combinam com o evento
  const onKey = (e, pressed) => {
    keycaps.forEach((k) => {
      const label = getLabel(k);
      if (matches(label, e)) setPressed(k, pressed);
    });
  };

  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup',   (e) => onKey(e, false));

  // Limpa estado ao perder o foco da janela (evita “presas”)
  window.addEventListener('blur', () => keycaps.forEach((k) => setPressed(k, false)));
})();


// ====== REVEALS com GSAP + ScrollTrigger ======
gsap.registerPlugin(ScrollTrigger);

(function () {
  // Se você quer respeitar reduce-motion, deixe true. Se quer animar mesmo assim, ponha false.
  const honorReducedMotion = true;
  const reduce = honorReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // coletores
  const selectors = [
    '.reveal-up', '.reveal-down', '.reveal-left',
    '.reveal-right', '.reveal-zoom', '.reveal-fade'
  ];
  const all = document.querySelectorAll(selectors.join(','));

  // aplica o “estado inicial” só se houver GSAP ativo
  all.forEach(el => el.classList.add('reveal-hide'));

  if (reduce) {
    // acessibilidade: mostra tudo sem animar
    all.forEach(el => el.classList.remove('reveal-hide'));
    return;
  }

  // helper: batch por tipo com tween adequado
  function makeBatch(selector, fromVars, toVars, opts = {}) {
    const defaults = { duration: 0.7, ease: 'power2.out' };
    const stagger = opts.stagger ?? 0.08;

    ScrollTrigger.batch(selector, {
      start: 'top 80%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          const delay = parseFloat(el.dataset.delay || 0) + i * stagger;
          gsap.fromTo(
            el,
            fromVars,
            { ...defaults, ...toVars, delay, onStart: () => el.classList.remove('reveal-hide') }
          );
        });
      }
    });
  }

  makeBatch('.reveal-up',    { y: 24,  opacity: 0 }, { y: 0, opacity: 1 });
  makeBatch('.reveal-down',  { y: -24, opacity: 0 }, { y: 0, opacity: 1 });
  makeBatch('.reveal-left',  { x: -28, opacity: 0 }, { x: 0, opacity: 1 });
  makeBatch('.reveal-right', { x: 28,  opacity: 0 }, { x: 0, opacity: 1 });
  makeBatch('.reveal-zoom',  { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1 }, { stagger: 0.06 });
  makeBatch('.reveal-fade',  { opacity: 0 }, { opacity: 1 });

  // garante que nada fique preso invisível
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
