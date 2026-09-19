// Paper for the inner pages. Same recipe as the landing: grain, mottle, and seeded
// flecks (specks and short fibre strands). Two modes:
//   plain   one viewport-sized sheet, fixed, multiplied over the page.
//   ledger  two sheets: the label rail on the left is a fixed sheet, the content
//           column is a second sheet that scrolls with the text, with a soft cut
//           edge between them. Falls back to plain on narrow screens.
// Set data-paper="ledger" on <body> for the second mode; data-paper-seed picks the seed.
(() => {
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function paperSheet(w, h, seed) {
    const r = mulberry32(seed);
    const f = n => n.toFixed(1);
    let flecks = '';
    const dots = Math.round(w * h / 3000), strands = Math.round(w * h / 20000), lights = Math.round(w * h / 9000);
    for (let i = 0; i < dots; i++) flecks += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${(0.35 + r() * 0.95).toFixed(2)}" fill="#3a3322" opacity="${(0.18 + r() * 0.45).toFixed(2)}"/>`;
    for (let i = 0; i < lights; i++) flecks += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${(0.6 + r() * 1.4).toFixed(2)}" fill="#fff" opacity="${(0.10 + r() * 0.2).toFixed(2)}"/>`;
    for (let i = 0; i < strands; i++) {
      const x = r() * w, y = r() * h, len = 5 + r() * 24, ang = r() * Math.PI * 2, bend = (r() - 0.5) * len * 0.6;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const mx = x + dx * len / 2 - dy * bend, my = y + dy * len / 2 + dx * bend;
      flecks += `<path d="M${f(x)} ${f(y)} Q${f(mx)} ${f(my)} ${f(x + dx * len)} ${f(y + dy * len)}" fill="none" stroke="#4d432a" stroke-width="${(0.5 + r() * 0.5).toFixed(2)}" opacity="${(0.14 + r() * 0.26).toFixed(2)}"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>` +
      `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="4" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.9" intercept="-.35"/><feFuncG type="linear" slope="1.9" intercept="-.35"/><feFuncB type="linear" slope="1.9" intercept="-.35"/><feFuncA type="table" tableValues="0 .7"/></feComponentTransfer></filter>` +
      `<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004" numOctaves="2" seed="${seed + 1}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .22"/></feComponentTransfer></filter>` +
      `</defs><rect width="100%" height="100%" filter="url(#g)"/><rect width="100%" height="100%" filter="url(#m)"/>${flecks}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const body = document.body;
  const seed = Number(body.dataset.paperSeed || 41);
  const ledgerMode = body.dataset.paper === 'ledger';

  // Fixed sheet (the whole page in plain mode, only the rail band in ledger mode).
  const fixed = document.createElement('img');
  fixed.id = 'paper'; fixed.alt = ''; fixed.setAttribute('aria-hidden', 'true');
  body.prepend(fixed);

  // Scrolling sheet and cut edge, ledger mode only.
  let sheet, edge;
  if (ledgerMode) {
    sheet = document.createElement('div'); sheet.id = 'paper-sheet'; sheet.setAttribute('aria-hidden', 'true');
    edge = document.createElement('div'); edge.id = 'paper-edge'; edge.setAttribute('aria-hidden', 'true');
    body.prepend(sheet); body.prepend(edge);
  }

  let timer = 0, lastKey = '';
  const cutX = () => {
    // The cut runs half a column-gap left of the content column.
    const v = document.querySelector('.ledger > .v');
    if (!v) return 0;
    const gap = parseFloat(getComputedStyle(document.querySelector('.ledger')).columnGap) || 40;
    return v.getBoundingClientRect().left - gap / 2;
  };
  const fit = () => {
    const W = innerWidth, H = innerHeight;
    const narrow = W <= 760 || !ledgerMode;
    const key = [W, H, narrow, document.documentElement.scrollHeight].join('x');
    if (key === lastKey) return; lastKey = key;
    if (narrow) {
      fixed.src = paperSheet(W, H, seed);
      fixed.style.maskImage = fixed.style.webkitMaskImage = '';
      if (sheet) { sheet.style.display = 'none'; edge.style.display = 'none'; }
      return;
    }
    const x = Math.round(cutX());
    const docH = document.documentElement.scrollHeight;
    fixed.src = paperSheet(W, H, seed);
    const m1 = `linear-gradient(to right, #000 ${x}px, transparent ${x}px)`;
    fixed.style.maskImage = m1; fixed.style.webkitMaskImage = m1;
    // The content sheet: a tall tile repeated down the page so a long page stays cheap.
    const tileH = 1400;
    sheet.style.display = ''; edge.style.display = '';
    sheet.style.height = docH + 'px';
    sheet.style.backgroundImage = `url("${paperSheet(W - x, tileH, seed + 7)}")`;
    sheet.style.left = x + 'px'; sheet.style.width = (W - x) + 'px';
    edge.style.left = x + 'px';
  };
  fit();
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(fit, 150); });
  if (ledgerMode) {
    new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(fit, 150); }).observe(document.body);
    if (document.fonts) document.fonts.ready.then(fit);
  }
})();
