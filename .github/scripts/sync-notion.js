/**
 * Fetches published events from the Notion database and writes data/events.json.
 * Runs inside GitHub Actions — needs NOTION_TOKEN and NOTION_DATABASE_ID secrets.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_DATABASE_ID;

if (!TOKEN || !DB_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID');
  process.exit(1);
}

const payload = JSON.stringify({
  filter: {
    property: 'Publicado',
    checkbox: { equals: true }
  },
  sorts: [
    { property: 'Fecha', direction: 'ascending' }
  ]
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

    const events = response.results.map(page => {
      const p = page.properties;

      // Debug: log all property keys and the link value
      const linkKey = Object.keys(p).find(k => k.toLowerCase().includes('inscribirse'));
      console.log('Link key found:', linkKey, '→', p[linkKey]);

      const imgProp = p['Imagen URL'];
      let imagen = '';
      if (imgProp?.url) {
        imagen = imgProp.url;                                  // columna tipo URL
      } else if (imgProp?.files?.[0]) {
        const f = imgProp.files[0];
        imagen = f.type === 'external' ? f.external.url : (f.file?.url || '');
      }

      return {
        id:          page.id,
        titulo:      text(p['Título']?.title),
        tipo:        p['Tag']?.select?.name                 || '',
        fecha:       p['Fecha']?.date?.start                || '',
        descripcion: text(p['Descripción']?.rich_text),
        imagen,
        link:        p['Link “Inscribirse”']?.url || '',
        horario:     text(p['Horario']?.rich_text)            || '',
        destacado:   p['Destacado en home']?.checkbox       || false
      };
    });

    const out = {
      updated: new Date().toISOString(),
      events
    };

    const dest = path.join(__dirname, '..', '..', 'data', 'events.json');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(out, null, 2));
    console.log(`✓ Synced ${events.length} events → data/events.json`);
  });
});

req.on('error', e => { console.error(e); process.exit(1); });
req.write(payload);
req.end();

function text(arr) {
  return (arr || []).map(t => t.plain_text).join('') || '';
}
