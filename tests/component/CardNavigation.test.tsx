import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
  const attributes = { ...props }; delete attributes.prefetch;
  return <a href={href} {...attributes}>{children}</a>;
} }));
import PetCardView from '../../components/PetCardView';
import AdoptionCardView from '../../components/AdoptionCardView';
import SittingCardView from '../../components/SittingCardView';
import PetImageGallery from '../../components/PetImageGallery';
import { LanguageProvider } from '../../lib/i18n';

it('exposes a named native card link and keeps reveal/call controls outside it', () => {
  const reveal = vi.fn();
  const { container, rerender } = render(<PetCardView status="lost" badgeLabel="Lost" name="Lucky" type="Нохой" color="хар" district="Баянзүрх" place="22" phone="88112233" revealed={false} onRevealPhone={reveal} detailHref="/pets/one?returnTo=%2Flistings" />);
  expect(screen.getByRole('link', { name: 'Дэлгэрэнгүй үзэх: Lucky' })).toHaveAttribute('href', '/pets/one?returnTo=%2Flistings');
  fireEvent.click(screen.getByRole('button', { name: 'Дугаар харах' }));
  expect(reveal).toHaveBeenCalledTimes(1);
  expect(container.querySelector('a button, a a')).toBeNull();
  rerender(<PetCardView status="lost" badgeLabel="Lost" name="Lucky" type="Нохой" color="хар" district="Баянзүрх" place="22" phone="88112233" detailHref="/pets/one" />);
  expect(container.querySelector('a[href="tel:88112233"]')?.closest('.listing-card-link')).toBeNull();
});
it('does not make a preview card navigable or leave an empty action area for chat-only contact', () => {
  const { container } = render(<PetCardView status="found" badgeLabel="Found" name="Lucky" type="Нохой" color="хар" district="Баянзүрх" place="22" phone="" interactive={false} detailHref="/pets/one" />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(container.querySelector('.card-actions')).toBeNull();
});
it('uses the same native link pattern for adoption and sitting cards', () => {
  const { container } = render(<>
    <AdoptionCardView badgeLabel="Adopt" name="Mimi" type="Муур" age="" gender="" breed="" district="Баянзүрх" place="22" phone="" detailHref="/adoptions/one" />
    <SittingCardView badgeLabel="Sitting" petType="Нохой" description="Friendly sitter" district="Баянзүрх" place="22" experience="" availability="" price={0} phone="" detailHref="/sitting/one" />
  </>);
  expect(screen.getByRole('link', { name: 'Дэлгэрэнгүй: Mimi' })).toHaveAttribute('href', '/adoptions/one');
  expect(screen.getByRole('link', { name: 'Дэлгэрэнгүй: Friendly sitter' })).toHaveAttribute('href', '/sitting/one');
  expect(container.querySelector('.detail-link')).toBeNull();
});
it('retains photo swiping and prevents its synthetic click from opening the detail page', () => {
  const { container } = render(<LanguageProvider><PetImageGallery images={['/one.png','/two.png']} alt="pet" href="/pets/one" linkLabel="Open Lucky" /></LanguageProvider>);
  const imageLink = screen.getByRole('link', { name: 'Open Lucky' });
  expect(imageLink).toHaveAttribute('tabindex', '-1');
  fireEvent.touchStart(imageLink, { touches: [{ clientX: 200, clientY: 200 }] });
  fireEvent.touchEnd(imageLink, { changedTouches: [{ clientX: 100, clientY: 210 }] });
  expect(screen.getByRole('img')).toHaveAttribute('alt', expect.stringContaining('2'));
  const click = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
  fireEvent(imageLink, click);
  expect(click.defaultPrevented).toBe(true);
  expect(container.querySelector('a button')).toBeNull();
});
