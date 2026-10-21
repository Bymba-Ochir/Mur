import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
const mock = vi.hoisted(() => ({ path: '/listings', push: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => mock.path, useRouter: () => ({ push: mock.push }) }));
import Onboarding from '../../components/Onboarding';
import InstallPrompt from '../../components/InstallPrompt';
import { LanguageProvider, useLanguage } from '../../lib/i18n';
import { useListingFilters } from '../../lib/useListingFilters';
beforeEach(() => {
  localStorage.clear(); mock.path = '/listings';
  window.history.replaceState(null, '', '/listings');
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => vi.unstubAllGlobals());
it('opens automatic onboarding only on home and remembers skipping', async () => {
  const { rerender, unmount } = render(<LanguageProvider><Onboarding /></LanguageProvider>);
  expect(screen.queryByRole('dialog')).toBeNull();
  mock.path = '/'; rerender(<LanguageProvider><Onboarding /></LanguageProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Алгасах' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  unmount(); render(<LanguageProvider><Onboarding /></LanguageProvider>);
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('allows manual guide on another route and closes on Escape', async () => {
  render(<LanguageProvider><Onboarding /></LanguageProvider>);
  act(() => window.dispatchEvent(new Event('mur:open-onboarding')));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('does not reopen install notice after another install event or remount', async () => {
  const { unmount } = render(<LanguageProvider><InstallPrompt /></LanguageProvider>);
  act(() => window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })));
  fireEvent.click(await screen.findByRole('button', { name: 'Аппыг суулгах саналыг хаах' }));
  act(() => window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })));
  expect(screen.queryByRole('region')).toBeNull();
  unmount(); render(<LanguageProvider><InstallPrompt /></LanguageProvider>);
  act(() => window.dispatchEvent(new Event('beforeinstallprompt')));
  expect(screen.queryByRole('region')).toBeNull();
});
function LanguageButton() { const { toggle } = useLanguage(); return <button onClick={toggle}>language</button>; }
it('updates the document language when switching language', () => {
  render(<LanguageProvider><LanguageButton /></LanguageProvider>);
  expect(document.documentElement.lang).toBe('mn');
  fireEvent.click(screen.getByText('language'));
  expect(document.documentElement.lang).toBe('en');
});
function Filters() { const f = useListingFilters(); return <><span>{f.status || 'all'}</span><input aria-label="query" value={f.search} onChange={e => f.setSearch(e.target.value)} /><button onClick={() => f.setStatus('found')}>found</button></>; }
it('restores filters from URL after remount and responds to history changes', () => {
  const { unmount } = render(<Filters />);
  fireEvent.click(screen.getByRole('button', { name: 'found' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'хар нохой' } });
  expect(new URLSearchParams(window.location.search).get('status')).toBe('found');
  unmount(); render(<Filters />);
  expect(screen.getByRole('textbox')).toHaveValue('хар нохой');
  act(() => { window.history.replaceState(null, '', '/listings?status=lost'); window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(screen.getByText('lost')).toBeInTheDocument();
});
