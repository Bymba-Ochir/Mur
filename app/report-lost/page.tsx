'use client';
import PetForm from '../../components/PetForm';
import { useLanguage } from '../../lib/i18n';

export default function ReportLostPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="eyebrow">{t('report_lost_eyebrow')}</div>
        <h1>{t('report_lost_title')}</h1>
        <p>{t('report_lost_desc')}</p>
      </div>
      <PetForm status="lost" />
    </div>
  );
}
