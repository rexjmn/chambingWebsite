import PublicProfile from '../../src/pages/PublicProfile';

const API = process.env.API_INTERNAL_URL || 'http://localhost:3000/api';

// Corre en el servidor — pre-carga el perfil del trabajador para SSR/SEO
export async function loader({ params }) {
  try {
    const [profileRes, reviewsRes] = await Promise.allSettled([
      fetch(`${API}/users/public/${params.userId}`),
      fetch(`${API}/users/${params.userId}/reviews`),
    ]);

    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
      ? await profileRes.value.json().then(d => d.data ?? d)
      : null;

    const reviews = reviewsRes.status === 'fulfilled' && reviewsRes.value.ok
      ? await reviewsRes.value.json().then(d => d.data ?? d.reviews ?? [])
      : [];

    return { profile, reviews };
  } catch {
    return { profile: null, reviews: [] };
  }
}

export default PublicProfile;
