import Misiones from '../../src/pages/Misiones';
import { buildMeta, SITE_URL, SITE_NAME } from '../seo';

const PAGE_URL = `${SITE_URL}/misiones`;

export function meta() {
  return [
    ...buildMeta({
      title: 'Misión Chambing | Proyectos y trabajos disponibles',
      description:
        'Descubre proyectos y misiones de trabajo publicados por clientes en El Salvador. Postúlate y conecta con quien necesita tu talento.',
      url: PAGE_URL,
    }),
    { name: 'robots', content: 'index, follow' },
  ];
}

export function links() {
  return [{ rel: 'canonical', href: PAGE_URL }];
}

export default function MisionesRoute() {
  return <Misiones />;
}
