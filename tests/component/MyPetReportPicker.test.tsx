import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { MyPet } from '../../lib/types';

const mocks = vi.hoisted(() => ({
  params: '', fetchMyPets: vi.fn(), fetchMyPetById: vi.fn(), submit: vi.fn(),
  form: {} as Record<string, unknown>,
}));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(mocks.params) }));
vi.mock('../../lib/useAuth', () => ({ useAuth: () => ({ user: { id: 'owner' }, loading: false }) }));
vi.mock('../../lib/vaccineService', () => ({ fetchMyPets: mocks.fetchMyPets, fetchMyPetById: mocks.fetchMyPetById }));
vi.mock('../../lib/usePetDraft', () => ({ usePetDraft: () => ({
  phase: 'editing', pending: null, error: '', saving: false, saved: false,
  saveAttempt: vi.fn(), clear: vi.fn(), restart: vi.fn(),
}) }));
vi.mock('../../lib/usePetForm', () => ({
  TYPE_VALUES: ['Нохой', 'Муур', 'Бусад'],
  usePhotoUpload: () => ({ photoFiles: [], previews: [], compressing: false, handlePhoto: vi.fn(), openFilePicker: vi.fn() }),
  usePetLocation: () => ({ coords: null, setCoords: vi.fn() }),
  usePetSubmit: ({ form }: { form: Record<string, unknown> }) => {
    mocks.form = form;
    return { submitting: false, statusMsg: '', done: false, error: null, handleSubmit: mocks.submit };
  },
}));
vi.mock('../../components/LocationMap', () => ({ default: () => null }));
vi.mock('../../components/PetPreviewCard', () => ({ default: () => null }));
vi.mock('../../components/BreedSelect', () => ({ default: ({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) =>
  <input id={id} value={value} onChange={event => onChange(event.target.value)} /> }));
import PetForm from '../../components/PetForm';
import { DICT, LanguageProvider } from '../../lib/i18n';

const pet: MyPet = {
  id: 'my-pet', name: 'Бор', type: 'Нохой', breed: 'Монгол банхар', photoUrl: null,
  age: '4', weight: 20, nextVaccineName: 'private vaccine', nextVaccineDate: '2026-12-01', createdAt: '2026-11-01',
};
function mount(status: 'lost' | 'found' = 'lost') {
  return render(<LanguageProvider><PetForm status={status} /></LanguageProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = '';
  mocks.form = {};
  mocks.fetchMyPets.mockResolvedValue([pet]);
  mocks.fetchMyPetById.mockResolvedValue(pet);
});

describe('lost reports from My pets', () => {
  it('fills only public pet details after selection and preserves report edits', async () => {
    mount();
    expect(mocks.fetchMyPets).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: DICT.mn.form_next_plain }));
    fireEvent.change(screen.getByLabelText(DICT.mn.color_label), { target: { value: 'хар халзан' } });
    fireEvent.click(screen.getByRole('button', { name: DICT.mn.form_mypet_choose }));
    fireEvent.click(await screen.findByRole('button', { name: 'Бор — ' + DICT.mn.form_mypet_use }));
    expect(screen.getByLabelText(DICT.mn.name_label)).toHaveValue('Бор');
    expect(screen.getByLabelText(DICT.mn.breed_label)).toHaveValue('Монгол банхар');
    expect(screen.getByLabelText(DICT.mn.color_label)).toHaveValue('хар халзан');
    expect(mocks.form).toMatchObject({ name: 'Бор', type: 'Нохой', breed: 'Монгол банхар', color: 'хар халзан', phone: '' });
    expect(mocks.form).not.toHaveProperty('nextVaccineName');
    expect(mocks.form).not.toHaveProperty('weight');
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it('loads a linked pet through the owner-scoped read and requires a deliberate selection', async () => {
    mocks.params = 'myPetId=my-pet&name=forged';
    mount();
    const choose = await screen.findByRole('button', { name: 'Бор — ' + DICT.mn.form_mypet_use });
    expect(mocks.fetchMyPetById).toHaveBeenCalledWith('my-pet');
    expect(mocks.form.name).toBe('');
    fireEvent.click(choose);
    expect(mocks.form.name).toBe('Бор');
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it('keeps the report usable when a linked pet cannot be read', async () => {
    mocks.params = 'myPetId=another-owner-pet';
    mocks.fetchMyPetById.mockRejectedValue(new Error('Not found'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(DICT.mn.form_mypet_error);
    expect(screen.queryByRole('button', { name: 'Бор — ' + DICT.mn.form_mypet_use })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: DICT.mn.form_next_plain }));
    expect(screen.getByLabelText(DICT.mn.name_label)).toHaveValue('');
  });

  it('requests six choices and one lookahead instead of loading every pet', async () => {
    mocks.fetchMyPets.mockResolvedValueOnce(Array.from({ length: 7 }, (_, i) => ({ ...pet, id: String(i), name: 'Pet ' + i })))
      .mockResolvedValueOnce([{ ...pet, id: '6', name: 'Pet 6' }]);
    mount();
    fireEvent.click(screen.getByRole('button', { name: DICT.mn.form_mypet_choose }));
    await screen.findByRole('button', { name: 'Pet 0 — ' + DICT.mn.form_mypet_use });
    expect(mocks.fetchMyPets).toHaveBeenCalledWith({ offset: 0, limit: 7 });
    expect(screen.queryByRole('button', { name: 'Pet 6 — ' + DICT.mn.form_mypet_use })).toBeNull();
    const picker = within(screen.getByRole('region', { name: DICT.mn.form_mypet_title }));
    fireEvent.click(picker.getByRole('button', { name: DICT.mn.form_mypet_next }));
    await waitFor(() => expect(mocks.fetchMyPets).toHaveBeenCalledWith({ offset: 6, limit: 7 }));
    expect(await screen.findByRole('button', { name: 'Pet 6 — ' + DICT.mn.form_mypet_use })).toBeInTheDocument();
  });

  it('does not offer the private pet selector on a found-animal report', () => {
    mocks.params = 'myPetId=my-pet';
    mount('found');
    expect(screen.queryByRole('button', { name: DICT.mn.form_mypet_choose })).toBeNull();
    expect(mocks.fetchMyPets).not.toHaveBeenCalled();
    expect(mocks.fetchMyPetById).not.toHaveBeenCalled();
  });
});
