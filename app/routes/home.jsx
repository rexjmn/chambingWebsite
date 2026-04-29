import Home from '../../src/pages/Home';
import { buildMeta, SITE_URL, SITE_NAME } from '../seo';

export function meta() {
  return [
    ...buildMeta({
      title: 'ChambingApp - Encuentra Profesionales de Confianza en El Salvador',
      description:
        'Contrata plomeros, electricistas, pintores, técnicos y más profesionales verificados en El Salvador. Rápido, seguro y con garantía de calidad.',
      url: SITE_URL,
    }),
    // Robots
    { name: 'robots', content: 'index, follow' },
    // Canonical (handled via <link> but meta is redundant safety net)
    { tagName: 'link', rel: 'canonical', href: SITE_URL },
  ];
}

// JSON-LD Organization schema — renderizado server-side, legible por Google
export function links() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/LogoChambing.png`,
    description:
      'Plataforma de servicios freelance que conecta clientes con profesionales verificados en El Salvador.',
    areaServed: {
      '@type': 'Country',
      name: 'El Salvador',
    },
    sameAs: [],
  };

  return [
    { rel: 'canonical', href: SITE_URL },
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify(jsonLd),
    },
  ];
}

export default Home;
