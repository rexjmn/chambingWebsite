import { useLoaderData } from 'react-router';
import PublicProfile from '../../src/pages/PublicProfile';
import { buildMeta, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../seo';

const API = globalThis?.process?.env?.API_INTERNAL_URL || 'http://localhost:3000/api';

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

    // Compute JSON-LD on the server so it ships in the initial HTML
    let jsonLd = null;
    if (profile) {
      const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ');
      const role = profile.titulo || 'Profesional';
      const url = `${SITE_URL}/profile/${params.userId}`;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.calificacion || 0), 0) / reviews.length
          : null;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        jobTitle: role,
        description: profile.bio || `Profesional verificado en ChambingApp El Salvador.`,
        image: profile.foto_perfil || DEFAULT_OG_IMAGE,
        url,
        worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
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
            reviewCount: reviews.length,
            bestRating: '5',
            worstRating: '1',
          },
        }),
      };
    }

    return { profile, reviews, jsonLd };
  } catch {
    return { profile: null, reviews: [], jsonLd: null };
  }
}

export function meta({ data, params }) {
  const profile = data?.profile;
  const url = `${SITE_URL}/profile/${params.userId}`;

  if (!profile) {
    return [
      ...buildMeta({
        title: `Perfil de Profesional | ${SITE_NAME}`,
        description: 'Consulta el perfil de este profesional verificado en ChambingApp El Salvador.',
        url,
      }),
      { tagName: 'link', rel: 'canonical', href: url },
    ];
  }

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ');
  const role = profile.titulo || 'Profesional';

  return [
    ...buildMeta({
      title: `${name} - ${role} | ${SITE_NAME}`,
      description:
        profile.bio?.slice(0, 155) ||
        `Contrata a ${name}, ${role} verificado en ChambingApp El Salvador.`,
      image: profile.foto_perfil || DEFAULT_OG_IMAGE,
      url,
      type: 'profile',
    }),
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: url },
  ];
}

export default function ProfileRoute() {
  const { jsonLd } = useLoaderData();
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PublicProfile />
    </>
  );
}
