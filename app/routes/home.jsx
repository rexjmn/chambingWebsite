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
    { name: 'robots', content: 'index, follow' },
  ];
}

export function links() {
  return [{ rel: 'canonical', href: SITE_URL }];
}

const orgJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/LogoChambing.png`,
  description:
    'Plataforma de servicios freelance que conecta clientes con profesionales verificados en El Salvador.',
  areaServed: { '@type': 'Country', name: 'El Salvador' },
});

export default function HomeRoute() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />
      <Home />
    </>
  );
}
