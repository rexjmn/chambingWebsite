const API = process.env.API_INTERNAL_URL || 'http://localhost:3000/api';
const SITE_URL = 'https://chambing.com';

const STATIC_URLS = [
  { loc: `${SITE_URL}/`,        changefreq: 'daily',   priority: '1.0' },
  { loc: `${SITE_URL}/service`, changefreq: 'hourly',  priority: '0.9' },
  { loc: `${SITE_URL}/login`,   changefreq: 'monthly', priority: '0.3' },
  { loc: `${SITE_URL}/register`,changefreq: 'monthly', priority: '0.3' },
];

async function fetchAllWorkerIds() {
  const ids = [];
  let page = 1;
  const limit = 100;

  while (true) {
    try {
      const res = await fetch(`${API}/users/workers?page=${page}&limit=${limit}`);
      if (!res.ok) break;
      const data = await res.json();
      const workers = data.data ?? data.workers ?? [];
      if (workers.length === 0) break;
      for (const w of workers) {
        const id = w.id ?? w.usuario_id ?? w.userId;
        if (id) ids.push(id);
      }
      if (workers.length < limit) break;
      page++;
    } catch {
      break;
    }
  }

  return ids;
}

function buildXml(urls) {
  const today = new Date().toISOString().split('T')[0];
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod ?? today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export async function loader() {
  const workerIds = await fetchAllWorkerIds();

  const profileUrls = workerIds.map((id) => ({
    loc: `${SITE_URL}/profile/${id}`,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const xml = buildXml([...STATIC_URLS, ...profileUrls]);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cachear 1 hora en Nginx/CDN, revalidar en background
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
