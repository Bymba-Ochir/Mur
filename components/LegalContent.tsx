'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  sections: LegalSection[];
}

function paragraphWithContact(text: string): ReactNode {
  const email = 'hello@mur.mn';
  const index = text.indexOf(email);
  if (index < 0) return text;
  return <>{text.slice(0, index)}<a href={`mailto:${email}`}>{email}</a>{text.slice(index + email.length)}</>;
}

export default function LegalContent({ mn, en, kind }: { mn: LegalDoc; en: LegalDoc; kind: 'privacy' | 'terms' }) {
  const { lang, t } = useLanguage();
  const doc = lang === 'mn' ? mn : en;
  const relatedHref = kind === 'privacy' ? '/terms' : '/privacy';
  const relatedTitle = kind === 'privacy' ? t('legal_terms') : t('legal_privacy');

  return (
    <article className="legal page-shell" aria-labelledby="legal-title">
      <header className="legal-hero">
        <div className="legal-icon" aria-hidden="true"><Icon name={kind === 'privacy' ? 'lock' : 'shield'} size={28} /></div>
        <div>
          <p className="eyebrow">{t('legal_eyebrow')}</p>
          <h1 id="legal-title">{doc.title}</h1>
          <p className="legal-updated"><Icon name="calendar" size={15} /><span className="sr-label">{t('legal_updated_label')}: </span>{doc.updated}</p>
        </div>
      </header>

      <details className="mobile-toc">
        <summary><Icon name="info" size={18} />{t('legal_toc_open')}</summary>
        <nav aria-label={t('legal_toc')}>
          <ol>{doc.sections.map((section, index) => <li key={section.heading}><a href={`#legal-section-${index + 1}`}>{section.heading}</a></li>)}</ol>
        </nav>
      </details>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <nav className="toc" aria-label={t('legal_toc')}>
            <h2>{t('legal_toc')}</h2>
            <ol>{doc.sections.map((section, index) => <li key={section.heading}><a href={`#legal-section-${index + 1}`}>{section.heading}</a></li>)}</ol>
          </nav>
          <Link href={relatedHref} className="related-link">
            <span><Icon name={kind === 'privacy' ? 'shield' : 'lock'} size={19} /></span>
            <span><small>{t('legal_related')}</small><strong>{relatedTitle}</strong></span>
            <Icon name="arrowRight" size={17} />
          </Link>
        </aside>

        <div className="legal-body">
          {doc.sections.map((section, index) => (
            <section id={`legal-section-${index + 1}`} key={section.heading} aria-labelledby={`legal-heading-${index + 1}`}>
              <span className="section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 id={`legal-heading-${index + 1}`}>{section.heading}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraphWithContact(paragraph)}</p>)}
              </div>
            </section>
          ))}
          <footer className="legal-footer">
            <div><Icon name="message" size={20} /><span><small>{t('legal_contact')}</small><a href="mailto:hello@mur.mn">hello@mur.mn</a></span></div>
            <Link href={relatedHref}>{relatedTitle}<Icon name="arrowRight" size={16} /></Link>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .legal{max-width:1080px}.legal-hero{display:flex;align-items:center;gap:var(--sp-4);margin-bottom:var(--sp-5);padding:clamp(22px,4vw,38px);border:1px solid var(--glass-border);border-radius:var(--r-xl);background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 9%,var(--card)),color-mix(in srgb,var(--found) 7%,var(--card)));box-shadow:var(--shadow-sm)}.legal-icon{display:grid;place-items:center;width:62px;height:62px;flex:0 0 62px;border-radius:var(--r-lg);color:var(--primary);background:var(--card);box-shadow:var(--shadow-sm)}.legal-hero .eyebrow{margin-bottom:var(--sp-2)}.legal-hero h1{margin:0 0 var(--sp-2);font-size:clamp(1.8rem,4vw,2.8rem)}.legal-updated{display:flex;align-items:center;gap:7px;color:var(--text-secondary);font-family:var(--font-mono);font-size:var(--text-xs)}.sr-label{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0)}
        .legal-layout{display:grid;grid-template-columns:260px minmax(0,1fr);align-items:start;gap:var(--sp-5)}.legal-sidebar{position:sticky;top:calc(var(--navbar-height,72px) + 18px);display:grid;gap:var(--sp-3)}.toc{padding:var(--sp-4);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card);box-shadow:var(--shadow-xs)}.toc h2{margin:0 0 var(--sp-3);font-size:var(--text-base)}.toc ol{display:grid;gap:3px;list-style:none;counter-reset:legal}.toc li{counter-increment:legal}.toc a{display:grid;grid-template-columns:22px minmax(0,1fr);gap:7px;padding:7px 8px;border-radius:var(--r-sm);color:var(--text-secondary);font-size:12.5px;line-height:1.4;text-decoration:none}.toc a:before{content:counter(legal,decimal-leading-zero);color:var(--primary);font-family:var(--font-mono);font-size:10px}.toc a:hover{color:var(--primary);background:var(--eyebrow-bg)}.toc a:focus-visible,.related-link:focus-visible,.legal-footer a:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.related-link{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;padding:var(--sp-3);border:1px solid var(--border-subtle);border-radius:var(--r-lg);color:var(--text-primary);background:var(--surface-2);text-decoration:none}.related-link>span:first-child{display:grid;place-items:center;width:38px;height:38px;border-radius:var(--r-md);color:var(--primary);background:var(--eyebrow-bg)}.related-link>span:nth-child(2){display:grid;gap:2px}.related-link small{color:var(--text-tertiary);font-size:10px}.related-link strong{font-size:12.5px}.related-link:hover{border-color:var(--primary-light);box-shadow:var(--shadow-sm)}
        .legal-body{overflow:hidden;border:1px solid var(--border-subtle);border-radius:var(--r-xl);background:var(--card);box-shadow:var(--shadow-sm)}.legal-body>section{display:grid;grid-template-columns:48px minmax(0,1fr);gap:var(--sp-3);padding:clamp(22px,4vw,38px)}.legal-body>section+section{border-top:1px solid var(--border-subtle)}.legal-body>section:target{background:color-mix(in srgb,var(--primary) 5%,var(--card))}.section-number{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;color:var(--primary);background:var(--eyebrow-bg);font-family:var(--font-mono);font-size:11px;font-weight:800}.legal-body h2{margin:6px 0 var(--sp-3);font-size:clamp(1.05rem,2vw,1.3rem)}.legal-body p{max-width:70ch;margin-bottom:var(--sp-3);color:var(--text-secondary);font-size:14.5px;line-height:1.8}.legal-body p:last-child{margin-bottom:0}.legal-body :global(p a){color:var(--primary);font-weight:750;text-underline-offset:3px}.legal-body>section{scroll-margin-top:125px}.legal-footer{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-4);border-top:1px solid var(--border-subtle);background:var(--surface-3)}.legal-footer>div{display:flex;align-items:center;gap:9px;color:var(--primary)}.legal-footer span{display:grid}.legal-footer small{color:var(--text-tertiary);font-size:10px}.legal-footer a{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:var(--text-sm);font-weight:750;text-decoration:none}.mobile-toc{display:none}
        @media(max-width:860px){.legal-layout{grid-template-columns:1fr}.legal-sidebar{display:none}.mobile-toc{display:block;margin-bottom:var(--sp-4);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card)}.mobile-toc summary{display:flex;align-items:center;gap:8px;min-height:48px;padding:0 var(--sp-3);color:var(--primary);font-weight:750;cursor:pointer}.mobile-toc summary:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.mobile-toc nav{padding:0 var(--sp-3) var(--sp-3)}.mobile-toc ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 20px;padding-left:20px}.mobile-toc a{display:block;padding:6px 0;color:var(--text-secondary);font-size:12.5px;text-decoration:none}.mobile-toc a:hover{color:var(--primary)}}
        @media(max-width:560px){.legal-hero{align-items:flex-start;margin-inline:calc(var(--page-pad) * -1);padding:var(--sp-4) var(--page-pad);border-inline:0;border-radius:0}.legal-icon{width:48px;height:48px;flex-basis:48px}.legal-hero h1{font-size:1.55rem}.mobile-toc ol{grid-template-columns:1fr}.legal-body{margin-inline:calc(var(--page-pad) * -1);border-inline:0;border-radius:0}.legal-body>section{grid-template-columns:1fr;padding:var(--sp-4) var(--page-pad)}.section-number{width:36px;height:36px}.legal-body h2{margin-top:0}.legal-body p{font-size:14px;line-height:1.75}.legal-footer{align-items:flex-start;flex-direction:column;padding:var(--sp-4) var(--page-pad)}}
      `}</style>
    </article>
  );
}
