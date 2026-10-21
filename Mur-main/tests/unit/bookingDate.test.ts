import { expect, it } from 'vitest';
import { ulaanbaatarDate, bookingEstimate } from '../../lib/bookingDate';
import { cleanShareUrl } from '../../components/ShareButtons';
it('uses Mongolia midnight rather than UTC midnight', () => {
 expect(ulaanbaatarDate(new Date('2026-09-09T15:59:59Z'))).toBe('2026-09-09');
 expect(ulaanbaatarDate(new Date('2026-09-09T16:00:00Z'))).toBe('2026-09-10');
});
it('distinguishes free from unspecified prices', () => {
 expect(bookingEstimate(0,'2026-09-10','2026-09-10')).toBe(0);
 expect(bookingEstimate(null,'2026-09-10','2026-09-10')).toBeNull();
});
it('counts inclusive days across month boundaries', () => {
 expect(bookingEstimate(100,'2026-09-30','2026-10-02')).toBe(300);
});
it('rejects reversed or missing dates', () => {
 expect(bookingEstimate(100,'2026-09-11','2026-09-10')).toBeNull();
 expect(bookingEstimate(100,'','2026-09-10')).toBeNull();
});
it('removes navigation history from shared URLs', () => {
 expect(cleanShareUrl('https://mur-chi.vercel.app/pets/123?returnTo=%2Flistings%3Fq%3Dsecret')).toBe('https://mur-chi.vercel.app/pets/123');
 expect(cleanShareUrl('https://mur-chi.vercel.app/pets/123?lang=en&returnTo=x')).toBe('https://mur-chi.vercel.app/pets/123?lang=en');
});
