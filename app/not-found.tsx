'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';
import styles from './recovery.module.css';

const routes = [
  { href: '/listings', label: 'nf_listings' },
  { href: '/report-lost', label: 'nf_report_lost' },
  { href: '/report-found', label: 'nf_report_found' },
] as const;

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <section className={styles.panel} aria-labelledby="not-found-title">
      <p className={styles.status}>404</p>
      <h1 id="not-found-title">{t('nf_title')}</h1>
      <p className={styles.desc}>{t('nf_desc')}</p>
      <div className={styles.actions}>
        <Button as="link" href="/" className={styles.action + ' ' + styles.primary}>{t('nf_home')}</Button>
      </div>

      <nav className={styles.paths} aria-label={t('nf_actions_label')}>
        <h2>{t('nf_help_title')}</h2>
        <ul>
          {routes.map((route) => (
            <li key={route.href}>
              <Link href={route.href}>
                {t(route.label)}
                <Icon name="arrowRight" size={17} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
