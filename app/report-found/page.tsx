'use client';
import PetForm from '../../components/PetForm';
import { useLanguage } from '../../lib/i18n';

export default function ReportFoundPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('report_found_eyebrow')}</div>
        <h1>{t('report_found_title')}</h1>
        <p>{t('report_found_desc')}</p>
      </div>
      <PetForm status="found" />
    </div>
  );
}
