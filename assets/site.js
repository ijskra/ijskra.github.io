// Optional enhancements only: content, language links and disclosure work without JS.
(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  for (const work of document.querySelectorAll('details.work')) {
    const summary = work.querySelector('summary');
    let pinned = false;
    const loadScore = () => {
      if (!work.open || innerWidth < 1120) return;
      for (const image of work.querySelectorAll('img[data-src]')) {
        image.src = image.dataset.src;
        delete image.dataset.src;
      }
    };
    work.addEventListener('toggle', loadScore);
    work.addEventListener('pointerenter', () => { if (finePointer.matches) { work.open = true; loadScore(); } });
    work.addEventListener('pointerleave', () => { if (finePointer.matches && !pinned && !work.contains(document.activeElement)) work.open = false; });
    summary.addEventListener('click', event => {
      if (event.target.closest('a') || !finePointer.matches || event.detail === 0) return;
      event.preventDefault();
      pinned = !pinned;
      work.open = pinned;
      loadScore();
    });
    work.addEventListener('focusout', () => queueMicrotask(() => {
      if (finePointer.matches && !pinned && !work.matches(':hover') && !work.contains(document.activeElement)) work.open = false;
    }));
  }
  // Also load a score when an already expanded phone layout grows into desktop.
  matchMedia('(min-width:1120px)').addEventListener('change', event => {
    if (event.matches) document.querySelectorAll('details[open] img[data-src]').forEach(image => { image.src = image.dataset.src; delete image.dataset.src; });
  });
  const links = [...document.querySelectorAll('nav a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  let pending = false;
  function updateCurrent() {
    pending = false;
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= 80) current = section;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
    links.forEach(link => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateCurrent); } }, { passive: true });
  updateCurrent();
  const language = document.querySelector('.language-link');
  language.addEventListener('click', () => {
    const current = links.find(link => link.hasAttribute('aria-current'));
    if (current) language.hash = current.hash;
  });
})();
