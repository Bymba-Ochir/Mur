'use client';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';

export default function LoadError({ onRetry }: { onRetry: () => void }) {
  const { lang } = useLanguage();
  return (
    <div className="content-panel flex flex-col items-center px-6 py-10 text-center" role="alert">
      <AlertCircle className="mb-3 text-[var(--alert)]" size={32} aria-hidden="true" />
      <h2 className="mb-2 text-lg font-bold text-[var(--text)]">
        {lang === 'mn' ? 'Мэдээлэл ачаалж чадсангүй' : 'Could not load the data'}
      </h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {lang === 'mn' ? 'Сүлжээний холболтоо шалгаад дахин оролдоно уу.' : 'Check your connection and try again.'}
      </p>
      <Button variant="ghost" onClick={onRetry}><RotateCcw size={16} />{lang === 'mn' ? 'Дахин оролдох' : 'Try again'}</Button>
    </div>
  );
}
