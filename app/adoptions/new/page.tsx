'use client';
import AdoptionForm from '../../../components/AdoptionForm';
import { useLanguage } from '../../../lib/i18n';

export default function NewAdoptionPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">{t('adoptions_new_eyebrow')}</p>
        <h1>{t('adoptions_new_title')}</h1>
        <p>{t('adoptions_new_desc')}</p>
      </div>
      <AdoptionForm />
    </div>
  );
}
