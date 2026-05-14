/**
 * Fetches hero slides from Notion and writes data/hero.json.
 * Notion DB columns: Título (title), Location (text), Descripción (text),
 *                    Imagen URL (url), Orden (number), Activo (checkbox)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_HERO_DB_ID;

if (!TOKEN || !DB_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_HERO_DB_ID');
  process.exit(1);
}

const payload = JSON.stringify({
  filter: { property: 'Activo', checkbox: { equals: true } },
  sorts:  [{ property: 'Orden', direction: 'ascending' }]
});

const options = {
  hostname: 'api.notion.com',
  path:     `/v1/databases/${DB_ID}/query`,
  method:   'POST',
  headers: {
    'Authorization':  `Bearer ${TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');

    if (res.statusCode !== 200) {
      console.error('Notion API error:', res.statusCode, raw);
      process.exit(1);
    }

    const response = JSON.parse(raw);

    const slides = response.results.map(page => {
      const p = page.properties;
      return {
        id:          page.id,
        titulo:      text(p['Título']?.title),
        location:    text(p['Location']?.rich_text),
        descripcion: text(p['Descripción']?.rich_text),
        imagen:      p['Imagen URL']?.url || '',
        orden:       p['Orden']?.number   ?? 99
      };
    });

    const out = { updated: new Date().toISOString(), slides };
    const dest = path.join(__dirname, '..', '..', 'data', 'hero.json');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(out, null, 2));
    console.log(`✓ Synced ${slides.length} hero slides → data/hero.json`);
  });
});

req.on('error', e => { console.error(e); process.exit(1); });
req.write(payload);
req.end();

function text(arr) {
  return (arr || []).map(t => t.plain_text).join('') || '';
}
