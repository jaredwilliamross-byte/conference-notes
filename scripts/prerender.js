// Writes every talk card into the static HTML of a page so search engines
// can read speakers, titles, summaries, and quotes without running JavaScript.
// The page's own script replaces this markup on load.
//
// Usage: node scripts/prerender.js [index.html] [april-2026.html ...]
// Re-run whenever the TALKS array changes.

const fs = require('fs');
const path = require('path');

const START = '<!-- prerender:start -->';
const END = '<!-- prerender:end -->';

const files = process.argv.slice(2);
if (!files.length) files.push('index.html');

for (const file of files) {
  const p = path.resolve(file);
  let html = fs.readFileSync(p, 'utf8');

  const src = html.slice(html.indexOf('const SESSIONS='), html.indexOf('function subscribeNewsletter'));
  const { SESSIONS, TALKS, buildCard } = new Function(
    `${src.replace('let currentSession', 'var currentSession')}; return { SESSIONS, TALKS, buildCard };`
  )();

  const cards = SESSIONS.flatMap(s => TALKS.filter(t => t.session === s))
    .map((t, i) => buildCard(t, i).replace(/ style="animation-delay:\d+ms"/, ''))
    .join('\n');
  const block = `${START}\n${cards}\n${END}`;

  if (html.includes(START)) {
    html = html.slice(0, html.indexOf(START)) + block + html.slice(html.indexOf(END) + END.length);
  } else {
    html = html.replace('<div id="talks-list"></div>', `<div id="talks-list">${block}</div>`);
  }
  fs.writeFileSync(p, html);
  console.log(`${file}: prerendered ${TALKS.length} talks`);
}
