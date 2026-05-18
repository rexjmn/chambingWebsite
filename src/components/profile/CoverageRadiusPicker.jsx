import React from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import './coverage-radius-picker.scss';

/** Valores enviados al API (km). El último se muestra como «50+». */
export const COVERAGE_RADIUS_KM_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50];

export function snapRadiusKmToPreset(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n < 1) return '';
  if (COVERAGE_RADIUS_KM_PRESETS.includes(n)) return String(n);
  return String(
    COVERAGE_RADIUS_KM_PRESETS.reduce((best, cur) =>
      Math.abs(cur - n) < Math.abs(best - n) ? cur : best,
    ),
  );
}

function presetLabel(km) {
  return km >= 50 ? '50+' : String(km);
}

/**
 * @param {'pais' | 'radio'} coverageType
 * @param {string} radiusKm — número como string, debe coincidir con un preset si radio
 * @param {(next: { tipo: 'pais' } | { tipo: 'radio', km: number }) => void} onChange
 * @param {boolean} [disabled]
 */
export default function CoverageRadiusPicker({
  coverageType,
  radiusKm,
  onChange,
  disabled = false,
}) {
  const selectedNum = radiusKm !== '' && radiusKm != null ? Number(radiusKm) : NaN;

  return (
    <div className="crp">
      <p className="crp__label">Zona de trabajo</p>

      <button
        type="button"
        className={`crp__all-sv ${coverageType === 'pais' ? 'crp__all-sv--active' : ''}`}
        disabled={disabled}
        aria-pressed={coverageType === 'pais'}
        onClick={() => onChange({ tipo: 'pais' })}
      >
        <MapPin size={18} aria-hidden className="crp__all-sv-icon" />
        Todo El Salvador
      </button>

      {coverageType === 'pais' && (
        <p className="crp__status crp__status--pais" role="status">
          <CheckCircle size={16} aria-hidden />
          Puedes recibir solicitudes en cualquier departamento del país. No necesitas
          compartir tu ubicación exacta.
        </p>
      )}

      <p className="crp__hint">
        O elige hasta qué distancia quieres recibir solicitudes desde tu ubicación aproximada:
      </p>

      <div className="crp__scale" role="group" aria-label="Distancia en kilómetros">
        <div className="crp__track" aria-hidden />
        <div className="crp__ticks">
          {COVERAGE_RADIUS_KM_PRESETS.map((km) => {
            const active =
              coverageType === 'radio' && Number.isFinite(selectedNum) && selectedNum === km;
            return (
              <button
                key={km}
                type="button"
                className={`crp__dot ${active ? 'crp__dot--active' : ''}`}
                disabled={disabled}
                onClick={() => onChange({ tipo: 'radio', km })}
                aria-pressed={active}
                aria-label={`${presetLabel(km)} kilómetros a la redonda`}
              >
                <span className="crp__dot-knob" aria-hidden />
                <span className="crp__dot-label">{presetLabel(km)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {coverageType === 'radio' && Number.isFinite(selectedNum) && (
        <p className="crp__status crp__status--radio" role="status">
          Trabajarás en un radio de {presetLabel(selectedNum)} km desde tu ubicación aproximada.
        </p>
      )}
    </div>
  );
}
