import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DocumentLanguage from '../../components/DocumentLanguage';
vi.mock('next/navigation', () => ({usePathname: () => '/report-lost'}));
vi.mock('../../lib/i18n', () => ({useLanguage: () => ({lang: 'en'})}));
afterEach(cleanup);
it('translates skip link and restores title after late metadata', async () => {
 render(<><DocumentLanguage/><main id="main-content"><h1>Enter the details</h1></main></>);
 expect(screen.getByRole('link', {name:'Skip to main content'})).toHaveAttribute('href','#main-content');
 await waitFor(() => expect(document.title).toBe('Report a lost pet | МӨР'));
 document.title = 'Хуучин гарчиг';
 await waitFor(() => expect(document.title).toBe('Report a lost pet | МӨР'));
});
