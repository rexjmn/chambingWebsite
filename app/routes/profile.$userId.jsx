import PublicProfile from '../../src/pages/PublicProfile';
import { buildMeta, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../seo';

const API = process.env.API_INTERNAL_URL || 'http://localhost:3000/api';

export async function loader({ params }) {
  try {
    const [profileRes, reviewsRes] = await Promise.allSettled([
      fetch(`${API}/users/public/${params.userId}`),
      fetch(`${API}/users/${params.userId}/reviews`),
    ]);

    const profile =
      profileRes.status === 'fulfilled' && profileRes.value.ok
        ? await profileRes.value.json().then((d) => d.data ?? d)
        : null;

    const reviews =
      reviewsRes.status === 'fulfilled' && reviewsRes.value.ok
        ? await reviewsRes.value.json().then((d) => d.data ?? d.reviews ?? [])
        : [];

    return { profile, reviews };
  } catch {
    return { profile: null, reviews: [] };
  }
}

export function meta({ data, params }) {
  const profile = data?.profile;

  if (!profile) {
    return buildMeta({
      title: `Perfil de Profesional | ${SITE_NAME}`,
      description: 'Consulta el perfil de este profesional verificado en ChambingApp El Salvador.',
      url: `${SITE_URL}/profile/${params.userId}`,
    });
  }

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ');
  const role = profile.titulo || 'Profesional';
  const title = `${name} - ${role} | ${SITE_NAME}`;
  const description =
    profile.bio?.slice(0, 155) ||
    `Contrata a ${name}, ${role} verificado en ChambingApp El Salvador.`;
  const image = profile.foto_perfil || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/profile/${params.userId}`;

  const avgRating =
    data.reviews?.length > 0
      ? data.reviews.reduce((sum, r) => sum + (r.calificacion || 0), 0) / data.reviews.length
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: role,
    description,
    image,
    url,
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(profile.ciudad && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.ciudad,
        addressCountry: 'SV',
      },
    }),
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: data.reviews.length,
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  return [
    ...buildMeta({ title, description, image, url, type: 'profile' }),
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: url },
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify(jsonLd),
    },
  ];
}

export default PublicProfile;
