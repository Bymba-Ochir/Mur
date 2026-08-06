'use client';
import SittingForm from '../../../components/SittingForm';
import { useLanguage } from '../../../lib/i18n';

export default function NewSittingPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('sitting_new_eyebrow')}</div>
        <h1>{t('sitting_new_title')}</h1>
        <p>{t('sitting_new_desc')}</p>
      </div>
      <SittingForm />
    </div>
  );
}
