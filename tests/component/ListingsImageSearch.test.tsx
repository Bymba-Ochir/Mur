import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ListingsPage from '../../app/listings/page';

const mocks = vi.hoisted(() => ({
  fetchPets: vi.fn(), fetchPetMatches: vi.fn(), rankBySimilarity: vi.fn(),
  getImageEmbeddings: vi.fn(), getImageHash: vi.fn(), findSameListingPhotos: vi.fn(), toast: vi.fn(),
}));
vi.mock('../../lib/petService', () => ({
  fetchPets: mocks.fetchPets, fetchPetMatches: mocks.fetchPetMatches, rankBySimilarity: mocks.rankBySimilarity,
}));
vi.mock('../../lib/similarity', () => ({ getImageEmbeddings: mocks.getImageEmbeddings, getImageHash: mocks.getImageHash }));
vi.mock('../../lib/listingPhotoMatch', () => ({ findSameListingPhotos: mocks.findSameListingPhotos }));
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../lib/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../lib/listingService', () => ({ saveSearch: vi.fn() }));
vi.mock('../../components/Toast', () => ({ useToast: () => mocks.toast }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../../components/NotifySubscribe', () => ({ default: () => null }));
vi.mock('../../components/VolunteerBadge', () => ({ default: () => null }));

function pet(id: string, name: string, similarity?: number) {
  return { id, name, similarity, status: 'lost', type: 'Нохой', photoURLs: [] };
}

function uploadPhoto() {
  fireEvent.change(screen.getByLabelText('listings_match_file_label'), {
    target: { files: [new File(['photo'], 'dog.jpg', { type: 'image/jpeg' })] },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, '', '/listings');
  mocks.fetchPets.mockResolvedValue({ pets: [pet('existing', 'Existing dog')], hasMore: true });
  mocks.findSameListingPhotos.mockResolvedValue([]);
  mocks.getImageEmbeddings.mockResolvedValue([[0.1], [0.2]]);
  mocks.getImageHash.mockResolvedValue('hash');
});

it.each([{ result: [] }, { result: null }])('keeps regular cards and pagination when the photo has no matches ($result)', async ({ result }) => {
  mocks.fetchPetMatches.mockResolvedValue(result);
  mocks.rankBySimilarity.mockReturnValue([]);
  render(<ListingsPage />);
  await screen.findByText('Existing dog');

  uploadPhoto();

  await screen.findByText('listings_match_none_keep');
  expect(screen.getByText('Existing dog')).toBeVisible();
  expect(screen.queryByText('empty_no_posts_title')).not.toBeInTheDocument();
  mocks.fetchPets.mockResolvedValueOnce({ pets: [pet('next', 'Next dog')], hasMore: false });
  fireEvent.click(screen.getByRole('button', { name: 'load_more' }));
  await screen.findByText('Next dog');
  expect(mocks.fetchPets).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
});

it.each(['database', 'browser'])('labels strong and borderline photos, dropping weak results (%s)', async (source) => {
  const candidates = [pet('strong', 'Strong photo', 70), pet('borderline', 'Borderline photo', 38), pet('weak', 'Weak photo', 37)];
  mocks.fetchPetMatches.mockResolvedValue(source === 'database' ? candidates : null);
  mocks.rankBySimilarity.mockReturnValue(candidates);
  render(<ListingsPage />);
  await screen.findByText('Existing dog');

  uploadPhoto();

  await screen.findByText('2 match_results');
  const review = screen.getByText('listings_match_review');
  const similar = screen.getByText('listings_card_similar_photo');
  expect(review).toBeVisible();
  expect(review.nextElementSibling).toContainElement(similar);
  expect(similar).toBeVisible();
  expect(screen.getByText('listings_card_slightly_similar_photo')).toBeVisible();
  expect(screen.queryByText('Weak photo')).not.toBeInTheDocument();
  expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
});

it('restores the loaded listings when a successful photo search is cleared', async () => {
  mocks.fetchPetMatches.mockResolvedValue([pet('match', 'Matching dog', 70)]);
  render(<ListingsPage />);
  await screen.findByText('Existing dog');

  uploadPhoto();
  await screen.findByText('Matching dog');
  expect(screen.queryByText('Existing dog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'listings_match_clear' }));

  expect(screen.getByText('Existing dog')).toBeVisible();
  expect(screen.getByRole('button', { name: 'load_more' })).toBeVisible();
  expect(mocks.fetchPets).toHaveBeenCalledOnce();
});

it('ignores a photo response when the user changes the listing filter', async () => {
  let finish!: (value: { id: string; name: string }[]) => void;
  mocks.fetchPetMatches.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ListingsPage />);
  await screen.findByText('Existing dog');
  uploadPhoto();
  await waitFor(() => expect(mocks.fetchPetMatches).toHaveBeenCalledOnce());

  fireEvent.change(screen.getByLabelText('listings_status_label'), { target: { value: 'lost' } });
  await act(async () => finish([{ id: 'stale', name: 'Stale result' }]));

  expect(mocks.fetchPetMatches.mock.calls[0][0].signal.aborted).toBe(true);
  expect(screen.queryByText('Stale result')).not.toBeInTheDocument();
  expect(screen.queryByText('listings_match_searching')).not.toBeInTheDocument();
});

it('shows a matching cover from outside the loaded page before running the model', async () => {
  mocks.findSameListingPhotos.mockResolvedValue([pet('same', 'Matching cover photo')]);
  render(<ListingsPage />);
  await screen.findByText('Existing dog');

  uploadPhoto();

  await screen.findByText('match_same_photo');
  expect(screen.getByText('listings_card_same_photo')).toBeVisible();
  expect(screen.getByText('Matching cover photo')).toBeVisible();
  expect(screen.queryByText('Existing dog')).not.toBeInTheDocument();
  expect(mocks.getImageEmbeddings).not.toHaveBeenCalled();
  expect(mocks.fetchPetMatches).not.toHaveBeenCalled();
});
