// Optional enhancements only: content, language links and disclosure work without JS.
(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  for (const work of document.querySelectorAll('details.work')) {
    const summary = work.querySelector('summary');
    let pinned = false;
    let intent = 0;
    const loadScore = () => {
      if (!work.open || innerWidth < 1120) return;
      for (const image of work.querySelectorAll('img[data-src]')) {
        image.src = image.dataset.src;
        delete image.dataset.src;
      }
    };
    work.addEventListener('toggle', loadScore);
    // A mouse that rests on a row previews it; one that only passes over on its way down the list does not.
    work.addEventListener('pointerenter', event => {
      if (!finePointer.matches || event.pointerType !== 'mouse' || work.open) return;
      intent = setTimeout(() => { work.open = true; loadScore(); }, 140);
    });
    // Closing a preview shortens the list; keep the row the pointer moved onto where it is, so it is not skipped.
    work.addEventListener('pointerleave', event => {
      clearTimeout(intent);
      if (!finePointer.matches || pinned || !work.open) return;
      const next = event.relatedTarget instanceof Element && event.relatedTarget.closest('details.work');
      const before = next && next !== work ? next.getBoundingClientRect().top : null;
      work.open = false;
      if (before !== null) scrollBy({ top: next.getBoundingClientRect().top - before, behavior: 'instant' });
    });
    summary.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      // Touch and keyboard keep the native toggle; its result counts as pinned, so moving away does not undo it.
      if (!finePointer.matches || event.detail === 0) { pinned = !work.open; return; }
      event.preventDefault();
      pinned = !pinned;
      work.open = pinned;
      loadScore();
    });
  }
  // The staff behind the biography continues the heading's rhythm only when the block is a whole number of
  // systems tall (the original design rounded it the same way); otherwise cropped lines show under the heading.
  // The extra room goes above the links under the biography: the staves are anchored to the block's bottom edge,
  // so the links keep their place in the gap between two staves while the top of the block lines up with the heading.
  const prose = document.querySelector('.about-prose');
  if (prose && 'ResizeObserver' in window) {
    const period = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--period')) || 69.55;
    const spacer = prose.querySelector('.about-actions');
    const snap = () => {
      if (!spacer) return;
      spacer.style.marginTop = '';
      const height = prose.getBoundingClientRect().height;
      const extra = Math.ceil(height / period - 1e-3) * period - height;
      if (extra > 0.05) spacer.style.marginTop = (parseFloat(getComputedStyle(spacer).marginTop) + extra).toFixed(2) + 'px';
    };
    const observer = new ResizeObserver(snap);
    for (const block of prose.children) observer.observe(block);
  }
  // Also load a score when an already expanded phone layout grows into desktop.
  matchMedia('(min-width:1120px)').addEventListener('change', event => {
    if (event.matches) document.querySelectorAll('details[open] img[data-src]').forEach(image => { image.src = image.dataset.src; delete image.dataset.src; });
  });
  const nav = document.querySelector('nav');
  // Lets the stylesheet fade the left edge too once the menu has been scrolled sideways.
  nav.addEventListener('scroll', () => nav.toggleAttribute('data-scrolled', nav.scrollLeft > 2), { passive: true });
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  // Bring a menu item fully into view, clear of the faded edges (20px on the left, 28px on the right).
  const reveal = item => {
    if (nav.scrollWidth <= nav.clientWidth) return;
    const r = item.getBoundingClientRect(), box = nav.getBoundingClientRect();
    if (r.left < box.left + 20) nav.scrollLeft += r.left - box.left - 20;
    else if (r.right > box.right - 32) nav.scrollLeft += r.right - box.right + 32;
  };
  // Keyboard focus only: a mouse or touch press focuses the link too, and moving it then would lose the click.
  nav.addEventListener('focusin', event => { if (event.target.matches(':focus-visible')) reveal(event.target); });
  let pending = false;
  let shown = null;
  function updateCurrent() {
    pending = false;
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= 80) current = section;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
    links.forEach(link => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    // On narrow screens the menu scrolls sideways: bring the current item into view when the section changes.
    if (current !== shown) {
      shown = current;
      const active = links.find(link => link.hash === '#' + current.id);
      if (active) reveal(active);
    }
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateCurrent); } }, { passive: true });
  // Place the current item again when the menu's width changes (not on height-only resizes, which would undo a manual scroll).
  if ('ResizeObserver' in window) new ResizeObserver(() => { shown = null; updateCurrent(); }).observe(nav);
  updateCurrent();
  // An announced event steps down from "upcoming" once its last day has passed, even before the data is updated.
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(n => String(n).padStart(2, '0')).join('-');
  const dated = [...document.querySelectorAll('[data-until]')];
  for (const item of dated) item.hidden = item.dataset.until < today;
  // "No upcoming events" shows only when nothing is left on screen, including announcements that have no last day.
  const noNews = document.querySelector('[data-news-empty]');
  if (noNews) noNews.hidden = [...noNews.parentElement.querySelectorAll('article.record:not([data-news-empty])')].some(item => !item.hidden);
  // Printing (or saving as PDF) shows every work in full, then returns the list to how it was.
  let unfolded = [];
  addEventListener('beforeprint', () => {
    if (unfolded.length) return;   // a second beforeprint before afterprint must not forget what to close again
    unfolded = [...document.querySelectorAll('details.work:not([open])')];
    for (const work of unfolded) work.open = true;
  });
  addEventListener('afterprint', () => {
    for (const work of unfolded) work.open = false;
    unfolded = [];
  });
  const language = document.querySelector('.language-link');
  language.addEventListener('click', () => {
    const current = links.find(link => link.hasAttribute('aria-current'));
    if (current) language.hash = current.hash;
  });
})();
