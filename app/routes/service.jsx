import Service from '../../src/pages/Service';
import { buildMeta, SITE_URL, SITE_NAME } from '../seo';

const API = globalThis?.process?.env?.API_INTERNAL_URL || 'http://localhost:3000/api';
const PAGE_URL = `${SITE_URL}/service`;

export async function loader() {
  try {
    const res = await fetch(`${API}/users/workers?page=1&limit=20`);
    if (!res.ok) return { initialWorkers: [] };
    const data = await res.json();
    return { initialWorkers: data.data ?? data.workers ?? [] };
  } catch {
    return { initialWorkers: [] };
  }
}

export function meta() {
  return [
    ...buildMeta({
      title: 'Servicios Disponibles | Chambing',
      description:
        'Explora cientos de profesionales disponibles en El Salvador. Plomeros, electricistas, pintores, técnicos, limpieza y más. Contrata con confianza.',
      url: PAGE_URL,
    }),
    { name: 'robots', content: 'index, follow' },
  ];
}

export function links() {
  return [{ rel: 'canonical', href: PAGE_URL }];
}

const pageJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `Servicios | ${SITE_NAME}`,
  url: PAGE_URL,
  description: 'Directorio de profesionales freelance verificados disponibles para contratación en El Salvador.',
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  about: {
    '@type': 'Service',
    areaServed: { '@type': 'Country', name: 'El Salvador' },
    serviceType: 'Servicios del hogar y profesionales',
  },
});

export default function ServiceRoute() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: pageJsonLd }} />
      <Service />
    </>
  );
}
