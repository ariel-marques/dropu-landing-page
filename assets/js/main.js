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

 // feedback real de clique + suporte a teclado
  const keys = document.querySelectorAll('.keycap');

  // mouse/touch
  keys.forEach(k => {
    k.addEventListener('mousedown', () => k.classList.add('is-pressed'));
    k.addEventListener('mouseup',   () => k.classList.remove('is-pressed'));
    k.addEventListener('mouseleave',() => k.classList.remove('is-pressed'));
    k.addEventListener('touchstart',() => k.classList.add('is-pressed'), {passive:true});
    k.addEventListener('touchend',  () => k.classList.remove('is-pressed'));
  });

  // mapear teclado físico para acender a tecla correspondente (fun little touch)
  const map = { 'Meta':'⌘', 'z':'Z', 'c':'C', 'v':'V' };
  window.addEventListener('keydown', (e) => {
    const label = map[e.key] || map[e.key.toLowerCase()];
    if(!label) return;
    const btn = [...keys].find(k => k.dataset.combo === label);
    if(btn){ btn.classList.add('is-pressed'); }
  });
  window.addEventListener('keyup', (e) => {
    const label = map[e.key] || map[e.key.toLowerCase()];
    if(!label) return;
    const btn = [...keys].find(k => k.dataset.combo === label);
    if(btn){ btn.classList.remove('is-pressed'); }
  });