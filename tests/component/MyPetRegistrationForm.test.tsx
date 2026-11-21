import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MyPetRegistrationForm from '../../components/MyPetRegistrationForm';
import { DICT, LanguageProvider } from '../../lib/i18n';
import type { MyPet } from '../../lib/types';

vi.mock('../../lib/myPetPhoto', () => ({ validateMyPetPhoto: (file: File) => { if (file.type !== 'image/jpeg') throw new Error('Invalid photo'); } }));
vi.mock('../../lib/imageCompress', () => ({ compressImage: vi.fn(async (file: File) => file) }));
vi.mock('../../components/BreedSelect', () => ({ default: ({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) => <input id={id} value={value} onChange={event => onChange(event.target.value)} /> }));

const initial: MyPet = { id: 'pet', name: 'Бор', type: 'Нохой', breed: 'Банхар', markings: 'Цээж цагаан', photoUrl: 'https://example.invalid/pet.jpg', age: null, weight: null, nextVaccineDate: null, nextVaccineName: null, createdAt: '2026-11-21' };
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:pet-photo');
  URL.revokeObjectURL = vi.fn();
});

it('saves reusable details and a selected photo only after submission', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<LanguageProvider><MyPetRegistrationForm saving={false} onSave={save} /></LanguageProvider>);
  fireEvent.change(screen.getByLabelText(DICT.mn.mypets_name_label + ' *'), { target: { value: 'Бор' } });
  fireEvent.change(screen.getByLabelText(DICT.mn.color_label.replace(' *', '')), { target: { value: 'Цээж цагаан' } });
  const photo = new File(['image'], 'pet.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText(DICT.mn.photo_label), { target: { files: [photo] } });
  await waitFor(() => expect(screen.getByRole('button', { name: DICT.mn.mypets_add })).toBeEnabled());
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: DICT.mn.mypets_add }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Бор', markings: 'Цээж цагаан', photoFile: photo })));
});

it('edits existing features and preserves the photo unless removal is requested', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<LanguageProvider><MyPetRegistrationForm initial={initial} saving={false} onSave={save} /></LanguageProvider>);
  expect(screen.getByLabelText(DICT.mn.color_label.replace(' *', ''))).toHaveValue('Цээж цагаан');
  fireEvent.click(screen.getByRole('button', { name: DICT.mn.detail_save }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ photoFile: undefined, markings: 'Цээж цагаан' })));
  fireEvent.click(screen.getByRole('button', { name: DICT.mn.photo_remove }));
  fireEvent.click(screen.getByRole('button', { name: DICT.mn.detail_save }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ photoFile: null })));
});

it('retains entered details when saving fails', async () => {
  const save = vi.fn().mockRejectedValue(new Error('offline'));
  render(<LanguageProvider><MyPetRegistrationForm initial={initial} saving={false} onSave={save} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: DICT.mn.detail_save }));
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  expect(screen.getByLabelText(DICT.mn.mypets_name_label + ' *')).toHaveValue('Бор');
});
