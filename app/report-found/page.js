'use client';
import PetForm from '../../components/PetForm';
import { useLanguage } from '../../lib/i18n';

export default function ReportFoundPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="eyebrow">{t('report_found_eyebrow')}</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{t('report_found_title')}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
        {t('report_found_desc')}
      </p>
      <PetForm status="found" />
    </div>
  );
}
