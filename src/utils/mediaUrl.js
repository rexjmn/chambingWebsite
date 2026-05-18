/**
 * Reescribe URLs S3 de Chambing al CDN (CloudFront) en el cliente.
 * Complementa la API cuando hay caché local o HTML SSR con URLs antiguas.
 *
 * VITE_CDN_URL=https://d18o1scxevdeid.cloudfront.net  (sin barra final)
 * VITE_S3_BUCKET=chambing  VITE_AWS_REGION=eu-north-1  (opcionales)
 */
const CDN_BASE = (import.meta.env.VITE_CDN_URL || '').replace(/\/$/, '');
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'chambing';
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'eu-north-1';

export function toCdnMediaUrl(url) {
  if (!url || !CDN_BASE) return url || null;

  try {
    const parsed = new URL(url);
    const virtualHosted = `${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    const legacyRegional = `s3.${AWS_REGION}.amazonaws.com`;

    let key = null;
    if (parsed.hostname === virtualHosted) {
      key = parsed.pathname.replace(/^\//, '');
    } else if (
      parsed.hostname === legacyRegional &&
      parsed.pathname.startsWith(`/${S3_BUCKET}/`)
    ) {
      key = parsed.pathname.slice(S3_BUCKET.length + 2);
    }

    if (!key) return url;
    return `${CDN_BASE}/${key}`;
  } catch {
    return url;
  }
}
