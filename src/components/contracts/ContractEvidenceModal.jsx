import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contractService } from '../../services/contractService';
import { compressImageToJpeg } from '../../utils/compressImage';
import { logger } from '../../utils/logger';
import { X, ImagePlus, Loader2, Video } from 'lucide-react';
import '../../styles/contractEvidenceModal.scss';

const MAX_VIDEO_SEC = 15;

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('metadata'));
    };
    v.src = url;
  });
}

/**
 * @param {'inicio'|'final'} phase
 * @param {() => Promise<void>} onPrimary — tras subidas opcionales (p.ej. confirmar llegada / completar)
 */
export default function ContractEvidenceModal({
  open,
  onClose,
  phase,
  contractId,
  onPrimary,
  primaryLabel,
}) {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const fase = phase === 'inicio' ? 'inicio' : 'final';

  const reset = () => {
    setImages([]);
    setVideo(null);
    setErr(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handlePrimary = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (!video && images.length === 0) {
        await onPrimary();
        reset();
        return;
      }
      if (video) {
        const dur = await readVideoDuration(video);
        if (dur > MAX_VIDEO_SEC + 1) {
          setErr(t('contractDetails.evidence.videoTooLong'));
          setBusy(false);
          return;
        }
        await contractService.uploadEvidenceFile(
          contractId,
          {
            fase,
            tipoMedia: 'video',
            mimeType: video.type || 'video/mp4',
            fileName: video.name,
            durationSeconds: Math.round(dur),
          },
          video,
        );
      } else {
        for (const raw of images) {
          const file =
            raw.type === 'image/jpeg'
              ? raw
              : await compressImageToJpeg(raw).catch(() => raw);
          await contractService.uploadEvidenceFile(
            contractId,
            {
              fase,
              tipoMedia: 'image',
              mimeType: file.type || 'image/jpeg',
              fileName: file.name,
            },
            file,
          );
        }
      }
      await onPrimary();
      reset();
    } catch (e) {
      logger.error('Evidence upload', e);
      setErr(e.message || t('contractDetails.evidence.uploadError'));
    } finally {
      setBusy(false);
    }
  };

  const skipAndPrimary = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onPrimary();
      reset();
    } catch (e) {
      setErr(e.message || t('contractDetails.errors.loadError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cem-overlay" role="dialog" aria-modal="true">
      <div className="cem-dialog">
        <button type="button" className="cem-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>
        <h2 className="cem-title">
          {phase === 'inicio'
            ? t('contractDetails.evidence.titleStart')
            : t('contractDetails.evidence.titleEnd')}
        </h2>
        <p className="cem-desc">
          {phase === 'inicio'
            ? t('contractDetails.evidence.descStart')
            : t('contractDetails.evidence.descEnd')}
        </p>
        <p className="cem-retention">{t('contractDetails.evidence.retention')}</p>

        {(phase === 'inicio' || phase === 'final') && (
          <>
            <label className="cem-file">
              <ImagePlus size={18} />
              <span>
                {phase === 'inicio'
                  ? t('contractDetails.evidence.pickImages')
                  : t('contractDetails.evidence.pickUpTo3')}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                disabled={!!video}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  setImages(files);
                  if (files.length) setVideo(null);
                }}
              />
            </label>
            <label className="cem-file">
              <Video size={18} />
              <span>{t('contractDetails.evidence.oneVideo')}</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                capture="environment"
                disabled={images.length > 0}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setVideo(f);
                  if (f) setImages([]);
                }}
              />
            </label>
          </>
        )}

        {images.length > 0 && (
          <p className="cem-meta">{t('contractDetails.evidence.selectedCount', { count: images.length })}</p>
        )}
        {video && <p className="cem-meta">{video.name}</p>}

        {err && <div className="cem-error">{err}</div>}

        <div className="cem-actions">
          <button type="button" className="cem-btn cem-btn--ghost" onClick={handleClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button type="button" className="cem-btn cem-btn--ghost" onClick={skipAndPrimary} disabled={busy}>
            {t('contractDetails.evidence.skip')}
          </button>
          <button type="button" className="cem-btn cem-btn--primary" onClick={handlePrimary} disabled={busy}>
            {busy ? <Loader2 className="cem-spin" size={18} /> : null}
            {primaryLabel || t('contractDetails.evidence.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
