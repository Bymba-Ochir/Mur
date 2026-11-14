'use client';

import { useLanguage } from '../lib/i18n';
import Button, { type ButtonSize } from './ui/Button';
import Icon from './ui/icons';

export default function ReportLostPetButton({ petId, size = 'sm' }: { petId: string; size?: ButtonSize }) {
  const { t } = useLanguage();
  return <Button as="link" href={'/report-lost?myPetId=' + encodeURIComponent(petId)} variant="secondary" size={size}>
    <Icon name="pin" size={16} />{t('mypets_report_lost')}
  </Button>;
}
