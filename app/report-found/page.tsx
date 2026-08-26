'use client';
import PetForm from '../../components/PetForm';
import AuthRequired from '../../components/AuthRequired';
import { useLanguage } from '../../lib/i18n';

export default function ReportFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="eyebrow">{t('report_found_eyebrow')}</div>
        <h1>{t('report_found_title')}</h1>
        <p>{t('report_found_desc')}</p>
      </div>
      <AuthRequired><PetForm status="found" /></AuthRequired>
    </div>
  );
}
