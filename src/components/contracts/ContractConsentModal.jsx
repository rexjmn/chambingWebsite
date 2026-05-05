import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import '../../styles/contractEvidenceModal.scss';

export default function ContractConsentModal({
  open,
  onClose,
  onConfirm,
  titleKey = 'contractDetails.consent.title',
  bodyKey = 'contractDetails.consent.body',
  checkboxKey = 'contractDetails.consent.checkbox',
  confirmKey = 'contractDetails.consent.confirmClose',
}) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const submit = async () => {
    if (!checked) {
      setErr(t('contractDetails.consent.mustAccept'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
      setChecked(false);
    } catch (e) {
      setErr(e.message || t('contractDetails.errors.loadError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cem-overlay" role="dialog" aria-modal="true">
      <div className="cem-dialog cem-dialog--consent">
        <button type="button" className="cem-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <h2 className="cem-title">{t(titleKey)}</h2>
        <p className="cem-desc">{t(bodyKey)}</p>
        <label className="cem-check">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>{t(checkboxKey)}</span>
        </label>
        {err && <div className="cem-error">{err}</div>}
        <div className="cem-actions">
          <button type="button" className="cem-btn cem-btn--ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button type="button" className="cem-btn cem-btn--primary" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="cem-spin" size={18} /> : null}
            {t(confirmKey)}
          </button>
        </div>
      </div>
    </div>
  );
}
