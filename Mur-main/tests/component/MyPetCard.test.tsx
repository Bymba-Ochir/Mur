import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
vi.mock('../../lib/supabase', () => ({ supabase: {} }));
import MyPetCard from '../../components/MyPetCard';
import { LanguageProvider } from '../../lib/i18n';
import type { MyPet } from '../../lib/types';
const pet: MyPet = { id:'test',name:'Бор',type:'Нохой',photoUrl:null,age:null,breed:null,weight:null,nextVaccineName:null,nextVaccineDate:'2026-10-01',createdAt:'2026-09-01' };
function mount(onDateChange: (date:string)=>Promise<void>) {
  return render(<LanguageProvider><MyPetCard pet={pet} selected={false} onSelect={()=>{}} onDelete={()=>{}} onDateChange={onDateChange} /></LanguageProvider>);
}
describe('vaccine date editing',()=>{
 it('does not save until confirmed and cancel restores the date',()=>{
  const save=vi.fn().mockResolvedValue(undefined);mount(save);
  const input=screen.getByDisplayValue('2026-10-01');
  fireEvent.change(input,{target:{value:'2026-11-01'}});
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Цуцлах'));
  expect(input).toHaveValue('2026-10-01');
 });
 it('keeps failed edits available for retry',async()=>{
  const save=vi.fn().mockRejectedValue(new Error('offline'));mount(save);
  fireEvent.change(screen.getByDisplayValue('2026-10-01'),{target:{value:'2026-11-01'}});
  fireEvent.click(screen.getByText('Хадгалах'));
  await waitFor(()=>expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByDisplayValue('2026-11-01')).toBeInTheDocument();
  expect(save).toHaveBeenCalledWith('2026-11-01');
 });
});
