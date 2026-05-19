// Central SEO constants — update SITE_URL when the production domain is confirmed
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://chambing.com';
export const SITE_NAME = 'Chambing';
export const SITE_LOCALE = 'es_SV';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const DEFAULT_TITLE = 'Chambing - Servicios Freelance en El Salvador';
export const DEFAULT_DESCRIPTION =
  'Conecta con profesionales verificados para servicios de plomería, electricidad, limpieza y más en El Salvador. Rápido, seguro y con garantía.';

export function buildMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  url = SITE_URL,
  type = 'website',
} = {}) {
  return [
    { title },
    { name: 'description', content: description },

    // Open Graph — WhatsApp, Messenger, Facebook, LinkedIn
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: SITE_LOCALE },
    { property: 'og:type', content: type },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:secure_url', content: image },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { property: 'og:url', content: url },

    // Twitter Card — X (Twitter)
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];
}
