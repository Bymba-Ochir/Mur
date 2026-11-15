import { beforeEach, expect, it, vi } from 'vitest';
import { SITE_PREVIEW_IMAGE, SITE_URL } from '../../lib/siteMetadata';

const mock = vi.hoisted(() => ({ single: vi.fn(), photos: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ single: mock.single }) }) }) } }));
vi.mock('../../lib/serverPhotoRepository', () => ({ fetchServerListingPhotoUrls: mock.photos }));
vi.mock('../../app/pets/[id]/PetDetailClient', () => ({ default: () => null }));
import { generateMetadata } from '../../app/pets/[id]/page';

beforeEach(() => {
  vi.clearAllMocks();
  mock.single.mockResolvedValue({ data: { status: 'lost', type: 'Нохой', name: 'Бамбар', district: 'Баянзүрх', place: 'Дэлгүүрийн ойролцоо', color: 'Шаргал' } });
  mock.photos.mockResolvedValue(['https://example.invalid/pet.webp']);
});

it('shares the pet-specific canonical and public photo without inventing its dimensions', async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ id: 'example-pet' }) });
  const canonical = new URL('/pets/example-pet', SITE_URL).href;
  expect(metadata.alternates?.canonical).toBe(canonical);
  expect(metadata.openGraph).toMatchObject({ url: canonical, images: [{ url: 'https://example.invalid/pet.webp', alt: 'Алдсан Нохой — Бамбар' }] });
  expect(metadata.openGraph).not.toHaveProperty('images.0.width');
});

it('uses the public brand image when a listing has no public photo', async () => {
  mock.photos.mockResolvedValue([]);
  const metadata = await generateMetadata({ params: Promise.resolve({ id: 'example-pet' }) });
  expect(metadata.openGraph).toMatchObject({ images: [{ url: SITE_PREVIEW_IMAGE }] });
  expect(metadata.twitter).toMatchObject({ card: 'summary', images: [SITE_PREVIEW_IMAGE] });
});

it('keeps missing listings out of search and does not fetch their photos', async () => {
  mock.single.mockResolvedValue({ data: null });
  const metadata = await generateMetadata({ params: Promise.resolve({ id: 'missing' }) });
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
  expect(mock.photos).not.toHaveBeenCalled();
});
