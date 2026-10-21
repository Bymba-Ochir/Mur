'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../lib/i18n';

/** Keep the browser title aligned with the translated, rendered page heading. */
export default function DocumentLanguage() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const update = () => {
      const heading = main.querySelector('h1')?.textContent?.trim();
      if (!heading) return;
      const formTitles: Record<string, string> = {
        '/report-lost': lang === 'mn' ? 'Алдсан амьтан мэдээлэх' : 'Report a lost pet',
        '/report-found': lang === 'mn' ? 'Олдсон амьтан мэдээлэх' : 'Report a found pet',
        '/adoptions/new': lang === 'mn' ? 'Үрчлүүлэх зар оруулах' : 'Create an adoption listing',
        '/sitting/new': lang === 'mn' ? 'Асрах үйлчилгээний зар оруулах' : 'Create a sitting listing',
      };
      const title = `${formTitles[pathname ?? ''] ?? heading} | МӨР`;
      if (document.title !== title) document.title = title;
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(main, { childList: true, subtree: true, characterData: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [lang, pathname]);
  return <a href="#main-content" className="skip-link">{lang === 'mn' ? 'Үндсэн агуулга руу шилжих' : 'Skip to main content'}</a>;
}
