'use client';
import SittingForm from '../../../components/SittingForm';
import { useLanguage } from '../../../lib/i18n';

export default function NewSittingPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="eyebrow">{t('sitting_new_eyebrow')}</p>
        <h1>{t('sitting_new_title')}</h1>
        <p>{t('sitting_new_desc')}</p>
      </header>
      <SittingForm />
    </div>
  );
}
