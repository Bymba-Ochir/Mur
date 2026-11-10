import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ListingsPage from '../../app/listings/page';

const mocks = vi.hoisted(() => ({
  fetchPets: vi.fn(), fetchPetMatches: vi.fn(), rankBySimilarity: vi.fn(),
  getImageEmbedding: vi.fn(), getImageHash: vi.fn(), findSameListingPhotos: vi.fn(), toast: vi.fn(),
}));
vi.mock('../../lib/petService', () => ({
  fetchPets: mocks.fetchPets, fetchPetMatches: mocks.fetchPetMatches, rankBySimilarity: mocks.rankBySimilarity,
}));
vi.mock('../../lib/similarity', () => ({ getImageEmbedding: mocks.getImageEmbedding, getImageHash: mocks.getImageHash }));
vi.mock('../../lib/listingPhotoMatch', () => ({ findSameListingPhotos: mocks.findSameListingPhotos }));
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../lib/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../lib/listingService', () => ({ saveSearch: vi.fn() }));
vi.mock('../../components/Toast', () => ({ useToast: () => mocks.toast }));
vi.mock('../../components/PetCard', () => ({ default: ({ pet }: { pet: { name: string } }) => <p>{pet.name}</p> }));
vi.mock('../../components/NotifySubscribe', () => ({ default: () => null }));
vi.mock('../../components/VolunteerBadge', () => ({ default: () => null }));

function uploadPhoto() {
  fireEvent.change(screen.getByLabelText('listings_match_file_label'), {
    target: { files: [new File(['photo'], 'dog.jpg', { type: 'image/jpeg' })] },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, '', '/listings');
  mocks.fetchPets.mockResolvedValue({ pets: [{ id: 'existing', name: 'Existing dog' }], hasMore: true });
  mocks.findSameListingPhotos.mockResolvedValue([]);
  mocks.getImageEmbedding.mockResolvedValue([0.1]);
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
  mocks.fetchPets.mockResolvedValueOnce({ pets: [{ id: 'next', name: 'Next dog' }], hasMore: false });
  fireEvent.click(screen.getByRole('button', { name: 'load_more' }));
  await screen.findByText('Next dog');
  expect(mocks.fetchPets).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
});

it('restores the loaded listings when a successful photo search is cleared', async () => {
  mocks.fetchPetMatches.mockResolvedValue([{ id: 'match', name: 'Matching dog' }]);
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
  const matchingPet = { id: 'same', name: 'Matching cover photo' };
  mocks.fetchPets.mockResolvedValue({
    pets: [{ id: 'existing', name: 'Existing dog' }],
    hasMore: true,
  });
  mocks.findSameListingPhotos.mockResolvedValue([matchingPet]);
  render(<ListingsPage />);
  await screen.findByText('Existing dog');

  uploadPhoto();

  await screen.findByText('1 match_results · match_same_photo');
  expect(screen.getByText('Matching cover photo')).toBeVisible();
  expect(screen.queryByText('Existing dog')).not.toBeInTheDocument();
  expect(mocks.getImageEmbedding).not.toHaveBeenCalled();
  expect(mocks.fetchPetMatches).not.toHaveBeenCalled();
});
