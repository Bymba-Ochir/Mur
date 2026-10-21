import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks=vi.hoisted(()=>({user:{id:'one',email:'one@example.com'} as {id:string,email:string}|null,load:vi.fn(),save:vi.fn(),toast:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,loading:false,logout:vi.fn()})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({t:(key:string)=>key})}));
vi.mock('../../lib/profileService',()=>({ensureMyProfile:mocks.load,updateMyProfile:mocks.save}));
vi.mock('../../components/Toast',()=>({useToast:()=>mocks.toast}));
vi.mock('../../components/LoginModal',()=>({default:()=>null}));
vi.mock('../../components/ui/Modal',()=>({default:()=>null}));
import SettingsPage from '../../app/settings/page';
const profile={displayName:'One',district:'',bio:'',isVolunteer:false,notificationPreferences:{messages:true,matches:true,vaccines:true}};
beforeEach(()=>{mocks.user={id:'one',email:'one@example.com'};mocks.load.mockReset().mockResolvedValue(profile);mocks.save.mockReset().mockResolvedValue(undefined);mocks.toast.mockReset();});
describe('settings account and save state',()=>{
 it('discards changed settings after account switch',async()=>{
  const {rerender}=render(<SettingsPage/>);
  fireEvent.click((await screen.findAllByRole('checkbox'))[0]);
  expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
  mocks.user={id:'two',email:'two@example.com'};rerender(<SettingsPage/>);
  expect((await screen.findAllByRole('checkbox'))[0]).toBeChecked();
 });
 it('preserves unsaved values and enables retry after failure',async()=>{
  mocks.save.mockRejectedValueOnce(new Error('offline'));
  render(<SettingsPage/>);
  fireEvent.click((await screen.findAllByRole('checkbox'))[0]);
  fireEvent.click(screen.getByRole('button',{name:'settings_save'}));
  await waitFor(()=>expect(mocks.toast).toHaveBeenCalledWith('offline','error'));
  expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
  expect(screen.getByRole('button',{name:'settings_save'})).toBeEnabled();
 });
 it('does not show a stale save confirmation after logout',async()=>{
  let resolve!:()=>void;
  mocks.save.mockImplementation(()=>new Promise<void>(r=>{resolve=r;}));
  const {rerender}=render(<SettingsPage/>);
  fireEvent.click((await screen.findAllByRole('checkbox'))[0]);
  fireEvent.click(screen.getByRole('button',{name:'settings_save'}));
  mocks.user=null;rerender(<SettingsPage/>);
  await act(async()=>resolve());
  expect(mocks.toast).not.toHaveBeenCalled();
 });
});
