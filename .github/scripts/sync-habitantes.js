/**
 * Fetches published habitantes from Notion and writes data/habitantes.json.
 * Runs inside GitHub Actions — needs NOTION_TOKEN and NOTION_HABITANTES_DB_ID secrets.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_HABITANTES_DB_ID;

if (!TOKEN || !DB_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_HABITANTES_DB_ID');
  process.exit(1);
}

const payload = JSON.stringify({
  filter: { property: 'Publicado', checkbox: { equals: true } },
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
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('Notion API error:', res.statusCode, raw);
      process.exit(1);
    }

    const response = JSON.parse(raw);

    const habitantes = response.results.map(page => {
      const p = page.properties;
      return {
        id:        page.id,
        nombre:    text(p['Nombre']?.title),
        rol:       text(p['Rol']?.rich_text),
        bio:       text(p['Bio']?.rich_text),
        instagram: cleanIg(text(p['Instagram']?.rich_text)),
        foto:      p['Foto URL']?.url || '',
        orden:     p['Orden']?.number ?? 999
      };
    });

    const out = { updated: new Date().toISOString(), habitantes };
    const dest = path.join(__dirname, '..', '..', 'data', 'habitantes.json');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(out, null, 2));
    console.log(`✓ Synced ${habitantes.length} habitantes → data/habitantes.json`);
  });
});

req.on('error', e => { console.error(e); process.exit(1); });
req.write(payload);
req.end();

function text(arr) {
  return (arr || []).map(t => t.plain_text).join('') || '';
}

function cleanIg(val) {
  if (!val) return '';
  const match = val.match(/instagram\.com\/([^/?#\s]+)/i);
  if (match) return match[1].replace(/\/$/, '');
  return val.replace(/^@/, '').trim();
}
