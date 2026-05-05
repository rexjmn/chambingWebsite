import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contractService } from '../../services/contractService';
import { logger } from '../../utils/logger';
import { Download, Image as ImageIcon, Film, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContractEvidenceGallery({ contractId, evidencias = [], onRefresh }) {
  const { t } = useTranslation();
  const [previewUrls, setPreviewUrls] = useState({});
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sortedEvidencias = useMemo(
    () => [...(evidencias || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [evidencias]
  );

  const canNavigate = sortedEvidencias.length > 1;
  const activeEvidence = sortedEvidencias[activeIndex] || null;

  useEffect(() => {
    if (!previewOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewOpen(false);
      if (event.key === 'ArrowRight' && canNavigate) {
        setActiveIndex((idx) => (idx + 1) % sortedEvidencias.length);
      }
      if (event.key === 'ArrowLeft' && canNavigate) {
        setActiveIndex((idx) => (idx - 1 + sortedEvidencias.length) % sortedEvidencias.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewOpen, canNavigate, sortedEvidencias.length]);

  const ensurePreviewUrl = async (evidence) => {
    if (!evidence?.id) return null;
    if (previewUrls[evidence.id]) return previewUrls[evidence.id];
    setPreviewLoadingId(evidence.id);
    try {
      const { url } = await contractService.getEvidenceDownloadUrl(contractId, evidence.id);
      setPreviewUrls((prev) => ({ ...prev, [evidence.id]: url }));
      return url;
    } catch (e) {
      logger.error('Load evidence preview URL', e);
      return null;
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const download = async (evidenceId) => {
    try {
      const { url } = await contractService.getEvidenceDownloadUrl(contractId, evidenceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      logger.error('Download evidence', e);
    }
  };

  const openPreview = async (index) => {
    const evidence = sortedEvidencias[index];
    if (!evidence) return;
    const url = await ensurePreviewUrl(evidence);
    if (!url) return;
    setActiveIndex(index);
    setPreviewOpen(true);
  };

  const activeUrl = activeEvidence ? previewUrls[activeEvidence.id] : null;

  if (!evidencias?.length) return null;

  return (
    <>
      <section className="contract-card cem-gallery">
        <div className="contract-card-body">
          <h2 className="contract-card-title">{t('contractDetails.evidence.galleryTitle')}</h2>
          <div className="contract-divider" />
          <ul className="cem-gallery-list cem-gallery-list--grid">
            {sortedEvidencias.map((ev, index) => {
              const previewUrl = previewUrls[ev.id];
              const isLoadingPreview = previewLoadingId === ev.id;
              const isVideo = ev.tipoMedia === 'video';

              return (
                <li key={ev.id} className="cem-gallery-item cem-gallery-item--card">
                  <button
                    type="button"
                    className="cem-thumb"
                    onClick={() => openPreview(index)}
                    disabled={isLoadingPreview}
                    aria-label={t('contractDetails.evidence.preview')}
                  >
                    {previewUrl ? (
                      isVideo ? (
                        <video src={previewUrl} muted playsInline preload="metadata" />
                      ) : (
                        <img src={previewUrl} alt={t('contractDetails.evidence.preview')} loading="lazy" />
                      )
                    ) : (
                      <span className="cem-thumb-placeholder">
                        {isVideo ? <Film size={20} /> : <ImageIcon size={20} />}
                      </span>
                    )}
                    <span className="cem-thumb-type">{isVideo ? <Film size={14} /> : <ImageIcon size={14} />}</span>
                  </button>

                  <span className="cem-gallery-meta">
                    {ev.fase === 'inicio'
                      ? t('contractDetails.evidence.phaseStart')
                      : t('contractDetails.evidence.phaseEnd')}{' '}
                    · {new Date(ev.createdAt).toLocaleString()}
                  </span>

                  <div className="cem-gallery-actions">
                    <button type="button" className="cd-btn cd-btn--outline" onClick={() => openPreview(index)}>
                      {t('contractDetails.evidence.preview')}
                    </button>
                    <button type="button" className="cd-btn cd-btn--outline" onClick={() => download(ev.id)}>
                      <Download size={16} />
                      {t('contractDetails.evidence.download')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {onRefresh && (
            <button type="button" className="cd-btn cd-btn--outline" onClick={onRefresh}>
              {t('contractDetails.evidence.refresh')}
            </button>
          )}
        </div>
      </section>

      {previewOpen && activeEvidence && (
        <div className="cem-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewOpen(false)}>
          <div className="cem-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cem-lightbox-close" onClick={() => setPreviewOpen(false)}>
              <X size={18} />
            </button>

            <div className="cem-lightbox-main">
              {!activeUrl ? (
                <div className="cem-lightbox-empty">...</div>
              ) : activeEvidence.tipoMedia === 'video' ? (
                <video src={activeUrl} controls playsInline autoPlay />
              ) : (
                <img src={activeUrl} alt={t('contractDetails.evidence.preview')} />
              )}
            </div>

            {canNavigate && (
              <>
                <button
                  type="button"
                  className="cem-lightbox-nav cem-lightbox-nav--prev"
                  onClick={() => setActiveIndex((idx) => (idx - 1 + sortedEvidencias.length) % sortedEvidencias.length)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="cem-lightbox-nav cem-lightbox-nav--next"
                  onClick={() => setActiveIndex((idx) => (idx + 1) % sortedEvidencias.length)}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <div className="cem-lightbox-strip">
              {sortedEvidencias.map((ev, index) => (
                <button
                  key={ev.id}
                  type="button"
                  className={`cem-strip-item${index === activeIndex ? ' is-active' : ''}`}
                  onClick={async () => {
                    await ensurePreviewUrl(ev);
                    setActiveIndex(index);
                  }}
                >
                  {previewUrls[ev.id] ? (
                    ev.tipoMedia === 'video' ? (
                      <video src={previewUrls[ev.id]} muted playsInline preload="metadata" />
                    ) : (
                      <img src={previewUrls[ev.id]} alt="" loading="lazy" />
                    )
                  ) : (
                    <span className="cem-thumb-placeholder">{ev.tipoMedia === 'video' ? <Film size={14} /> : <ImageIcon size={14} />}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
