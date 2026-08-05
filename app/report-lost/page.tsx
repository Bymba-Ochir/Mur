'use client';
import PetForm from '../../components/PetForm';
import { useLanguage } from '../../lib/i18n';

export default function ReportLostPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="eyebrow">{t('report_lost_eyebrow')}</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{t('report_lost_title')}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
        {t('report_lost_desc')}
      </p>
      <PetForm status="lost" />
    </div>
  );
}
