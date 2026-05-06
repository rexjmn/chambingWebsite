import MisionDetalle from '../../src/pages/MisionDetalle';
import { buildMeta, SITE_URL } from '../seo';

export function meta({ params }) {
  return buildMeta({
    title: 'Misión | Chambing',
    description: 'Detalles de la misión de trabajo. Postúlate y conecta con el cliente.',
    url: `${SITE_URL}/misiones/${params?.misionId || ''}`,
  });
}

export default function MisionDetalleRoute() {
  return <MisionDetalle />;
}
