import PropTypes from 'prop-types';
import { Stack, Button } from '@mui/material';
import { buildMapsUrls, parseCoordenadas } from '../utils/mapLinks';

const linkSx = { textTransform: 'none' };

/**
 * Enlaces externos a Google Maps y Waze (abren en nueva pestaña).
 * @param {'mui' | 'contract'} variant — estilos MUI o anclas tipo detalle de contrato
 */
export default function MapAppLinks({
  address,
  coordenadas,
  variant = 'mui',
  className,
}) {
  const coords = parseCoordenadas(coordenadas);
  const { google, waze } = buildMapsUrls({
    lat: coords?.lat,
    lng: coords?.lng,
    address,
  });

  if (!google && !waze) return null;

  const common = {
    target: '_blank',
    rel: 'noopener noreferrer',
  };

  if (variant === 'contract') {
    return (
      <div className={className || 'map-app-links'}>
        {google && (
          <a {...common} href={google} className="cd-btn cd-btn--outline map-app-links__a">
            Google Maps
          </a>
        )}
        {waze && (
          <a {...common} href={waze} className="cd-btn cd-btn--outline map-app-links__a">
            Waze
          </a>
        )}
      </div>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
      {google && (
        <Button
          {...common}
          component="a"
          href={google}
          size="small"
          variant="outlined"
          sx={linkSx}
        >
          Google Maps
        </Button>
      )}
      {waze && (
        <Button {...common} component="a" href={waze} size="small" variant="outlined" sx={linkSx}>
          Waze
        </Button>
      )}
    </Stack>
  );
}

MapAppLinks.propTypes = {
  address: PropTypes.string,
  coordenadas: PropTypes.shape({
    lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  variant: PropTypes.oneOf(['mui', 'contract']),
  className: PropTypes.string,
};
