import { useTranslation } from 'react-i18next';
import { contractService } from '../../services/contractService';
import { logger } from '../../utils/logger';
import { Download, Image as ImageIcon, Film } from 'lucide-react';

export default function ContractEvidenceGallery({ contractId, evidencias = [], onRefresh }) {
  const { t } = useTranslation();

  const download = async (evidenceId) => {
    try {
      const { url } = await contractService.getEvidenceDownloadUrl(contractId, evidenceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      logger.error('Download evidence', e);
    }
  };

  if (!evidencias?.length) return null;

  return (
    <section className="contract-card cem-gallery">
      <div className="contract-card-body">
        <h2 className="contract-card-title">{t('contractDetails.evidence.galleryTitle')}</h2>
        <div className="contract-divider" />
        <ul className="cem-gallery-list">
          {evidencias.map((ev) => (
            <li key={ev.id} className="cem-gallery-item">
              {ev.tipoMedia === 'video' ? <Film size={18} /> : <ImageIcon size={18} />}
              <span className="cem-gallery-meta">
                {ev.fase === 'inicio'
                  ? t('contractDetails.evidence.phaseStart')
                  : t('contractDetails.evidence.phaseEnd')}{' '}
                · {new Date(ev.createdAt).toLocaleString()}
              </span>
              <button type="button" className="cd-btn cd-btn--outline" onClick={() => download(ev.id)}>
                <Download size={16} />
                {t('contractDetails.evidence.download')}
              </button>
            </li>
          ))}
        </ul>
        {onRefresh && (
          <button type="button" className="cd-btn cd-btn--outline" onClick={onRefresh}>
            {t('contractDetails.evidence.refresh')}
          </button>
        )}
      </div>
    </section>
  );
}
