'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';
import { useLanguage } from '../lib/i18n';
import Modal from './ui/Modal';
import Button from './ui/Button';

export interface BankTransfer { iban: string; bank: string; recipient: string }

export default function DonateButton({ bankTransfer }: { bankTransfer?: BankTransfer }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);
  const close = () => { setOpen(false); setCopyStatus(null); };
  const label = t('donate_btn');
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-haspopup="dialog">{label}</Button>
      {open && (bankTransfer ? (
        <Modal open onClose={close} title={t('donate_title')} closeLabel={t('donate_close')} width="sm">
          <p>{t('donate_transfer_hint')}</p>
          <p>{bankTransfer.bank} · {bankTransfer.recipient}</p>
          <p><code>{bankTransfer.iban}</code></p>
          <Button fullWidth onClick={async () => {
            try {
              await navigator.clipboard.writeText(bankTransfer.iban);
              setCopyStatus('copied');
            } catch {
              setCopyStatus('failed');
            }
          }}>{t('donate_copy_iban')}</Button>
          <p role="status">{copyStatus && t(copyStatus === 'copied' ? 'donate_iban_copied' : 'donate_copy_failed')}</p>
        </Modal>
      ) : <DonateModal onClose={close} />)}
    </>
  );
}
