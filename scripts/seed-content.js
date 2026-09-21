// ===== One-time CMS seed script =====
// Extracts editable regions from the static HTML pages, writes them to
// data/content-defaults.js, and replaces each region in the HTML with a
// <!--BLOCK:key--> token that server.js fills at request time.
//
// Run once:  node scripts/seed-content.js
// Safe guard: aborts if the pages appear to be already tokenized.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  { id: 'index', label: 'Home', file: 'index.html', blocks: [
    { key: 'home/hero', label: 'Hero' },
    { key: 'home/stats', label: 'Stats bar' },
    { key: 'home/learn', label: "What You'll Learn (modules section)" },
    { key: 'home/beneficiaries', label: 'Who This Is For' }
  ] },
  { id: 'about', label: 'About', file: 'about.html', blocks: [
    { key: 'about/banner', label: 'Page banner' },
    { key: 'about/challenge-gap', label: 'The Challenge & The Gap' },
    { key: 'about/objectives', label: 'Goal & Objectives' },
    { key: 'about/approach', label: 'How We Develop Content' },
    { key: 'about/phases', label: 'Project Phases' },
    { key: 'about/outcomes', label: 'Expected Outcomes' }
  ] },
  { id: 'learning', label: 'Learning', file: 'learning.html', blocks: [
    { key: 'learning/banner', label: 'Page banner' },
    { key: 'learning/curriculum', label: 'Curriculum (module list section)' },
    { key: 'learning/resources', label: 'What We Produce' },
    { key: 'learning/cta', label: 'Ready to Start Learning (CTA)' }
  ] },
  { id: 'faq', label: 'FAQ', file: 'faq.html', blocks: [
    { key: 'faq/banner', label: 'Page banner' },
    { key: 'faq/list', label: 'FAQ items' },
    { key: 'faq/cta', label: 'Still have a question (CTA)' }
  ] },
  { id: 'contact', label: 'Contact', file: 'contact.html', blocks: [
    { key: 'contact/banner', label: 'Page banner' },
    { key: 'contact/info', label: 'Contact details (left column)' },
    { key: 'contact/partners', label: 'Potential Partners' },
    { key: 'contact/sustainability', label: 'Sustainability & Get Involved' }
  ] },
  { id: 'shared', label: 'Shared (all pages)', file: null, blocks: [
    { key: 'shared/footer', label: 'Footer' }
  ] }
];

const ANCHORS = {
  'home/hero': { tag: 'section', anchor: 'class="hero-badge"' },
  'home/stats': { tag: 'div', anchor: 'class="stats-bar"' },
  'home/learn': { tag: 'section', anchor: "What You'll Learn" },
  'home/beneficiaries': { tag: 'section', anchor: 'Who This Is For' },
  'about/banner': { tag: 'section', anchor: 'Building Digital Bridges Across Zambia' },
  'about/challenge-gap': { tag: 'section', anchor: 'The Challenge' },
  'about/objectives': { tag: 'section', anchor: 'Project Goal &amp; Objectives' },
  'about/approach': { tag: 'section', anchor: 'How We Develop Content' },
  'about/phases': { tag: 'section', anchor: 'Project Phases' },
  'about/outcomes': { tag: 'section', anchor: 'Expected Outcomes' },
  'learning/banner': { tag: 'section', anchor: 'Digital Literacy Learning Modules' },
  'learning/curriculum': { tag: 'section', anchor: 'id="moduleList"' },
  'learning/resources': { tag: 'section', anchor: 'What We Produce' },
  'learning/cta': { tag: 'section', anchor: 'Ready to Start Learning?' },
  'faq/banner': { tag: 'section', anchor: 'Frequently Asked Questions' },
  'faq/list': { tag: 'div', anchor: 'id="faqList"' },
  'faq/cta': { tag: 'section', anchor: 'Still have a question?' },
  'contact/banner': { tag: 'section', anchor: '<h1>Contact Us</h1>' },
  'contact/info': { tag: 'div', anchor: "Let's Build Bridges Together" },
  'contact/partners': { tag: 'section', anchor: 'Potential Partners' },
  'contact/sustainability': { tag: 'section', anchor: 'Sustainability' },
  'shared/footer': { tag: 'footer', anchor: 'footer-brand' }
};

const FOOTER_FILES = ['index.html', 'about.html', 'learning.html', 'faq.html', 'contact.html', 'module.html'];

function findBlock(html, tag, anchor) {
  const aIdx = html.indexOf(anchor);
  if (aIdx === -1) throw new Error('Anchor not found: ' + anchor);
  const startIdx = html.lastIndexOf('<' + tag, aIdx);
  if (startIdx === -1) throw new Error('Opening <' + tag + '> not found before anchor: ' + anchor);
  const openRe = new RegExp('<' + tag + '\\b', 'g');
  const closeRe = new RegExp('</' + tag + '>', 'g');
  let depth = 0, pos = startIdx;
  while (pos < html.length) {
    openRe.lastIndex = pos; closeRe.lastIndex = pos;
    const o = openRe.exec(html);
    const c = closeRe.exec(html);
    if (!c) throw new Error('No closing </' + tag + '> for anchor: ' + anchor);
    if (o && o.index < c.index) { depth++; pos = o.index + o[0].length; }
    else { depth--; pos = c.index + c[0].length; if (depth === 0) { const end = c.index + c[0].length; return { start: startIdx, end, text: html.slice(startIdx, end) }; } }
  }
  throw new Error('Unbalanced <' + tag + '> for anchor: ' + anchor);
}

function main() {
  // Guard against double-run
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (indexHtml.includes('<!--BLOCK:')) {
    console.error('ABORT: pages already tokenized (found <!--BLOCK: in index.html). Restore from .cms-baseline/html if you need to re-run.');
    process.exit(1);
  }

  const files = {};
  const read = f => { if (!(f in files)) files[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); return files[f]; };
  const write = (f, s) => { files[f] = s; };

  const blockDefaults = {};

  // Per-page blocks
  for (const page of PAGES) {
    if (!page.file) continue;
    let html = read(page.file);
    for (const b of page.blocks) {
      const spec = ANCHORS[b.key];
      const found = findBlock(html, spec.tag, spec.anchor);
      blockDefaults[b.key] = found.text;
      html = html.slice(0, found.start) + '<!--BLOCK:' + b.key + '-->' + html.slice(found.end);
      console.log('  extracted ' + b.key + ' (' + found.text.length + ' chars)');
    }
    write(page.file, html);
  }

  // Shared footer across all pages (default captured from index.html)
  let footerDefault = null;
  for (const f of FOOTER_FILES) {
    let html = read(f);
    const spec = ANCHORS['shared/footer'];
    let found;
    try { found = findBlock(html, spec.tag, spec.anchor); }
    catch (e) { console.log('  footer not found in ' + f + ' (skipped)'); continue; }
    if (footerDefault === null) footerDefault = found.text;
    html = html.slice(0, found.start) + '<!--BLOCK:shared/footer-->' + html.slice(found.end);
    write(f, html);
    console.log('  tokenized footer in ' + f);
  }
  blockDefaults['shared/footer'] = footerDefault;

  // Modules (from js/modules-data.js) with empty raw-HTML override slots
  global.window = {};
  require(path.join(ROOT, 'js', 'modules-data.js'));
  const mods = (global.window.MODULES_DATA || []).map(m => Object.assign({}, m, { homeCardHtml: '', listCardHtml: '', bodyHtml: '' }));

  // Write files back
  for (const f of Object.keys(files)) fs.writeFileSync(path.join(ROOT, f), files[f]);

  // Write defaults module
  const out = { version: 1, pages: PAGES.map(p => ({ id: p.id, label: p.label, blocks: p.blocks })), blockDefaults, moduleDefaults: mods };
  const defaultsPath = path.join(ROOT, 'data', 'content-defaults.js');
  fs.writeFileSync(defaultsPath, '// Auto-generated by scripts/seed-content.js. Default content used for CMS "Reset to default".\nmodule.exports = ' + JSON.stringify(out, null, 2) + ';\n');

  console.log('\nWrote data/content-defaults.js');
  console.log('  blocks: ' + Object.keys(blockDefaults).length + ', modules: ' + mods.length);
  console.log('Done. Tokenized: ' + FOOTER_FILES.join(', '));
}

main();
