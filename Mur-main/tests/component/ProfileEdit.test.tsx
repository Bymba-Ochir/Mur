import {beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
const m=vi.hoisted(()=>({user:{id:'one'} as {id:string}|null,save:vi.fn(),avatar:vi.fn(),push:vi.fn(),toast:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:m.push,back:vi.fn()})}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:m.user,loading:false})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({lang:'en',t:(k:string)=>k})}));
vi.mock('../../components/Toast',()=>({useToast:()=>m.toast}));
vi.mock('../../lib/profileService',()=>({ensureMyProfile:async()=>({displayName:'Original',district:'',bio:'',isVolunteer:false,avatarUrl:null}),updateMyProfile:m.save,uploadMyAvatar:m.avatar}));
import Page from '../../app/profile/edit/page';
beforeEach(()=>{m.user={id:'one'};m.save.mockReset();m.avatar.mockReset();m.push.mockReset();m.toast.mockReset();});
it('locks pending save fields and preserves a failed draft',async()=>{
 let reject!:(e:Error)=>void;m.save.mockImplementation(()=>new Promise((_,r)=>{reject=r;}));
 render(<Page/>);const name=await screen.findByLabelText('profile_name_label');
 fireEvent.change(name,{target:{value:'Changed'}});fireEvent.click(screen.getByRole('button',{name:'profile_save'}));
 expect(name).toBeDisabled();
 await act(async()=>reject(new Error('offline')));
 expect(name).toBeEnabled();expect(name).toHaveValue('Changed');expect(m.push).not.toHaveBeenCalled();
});
it('does not redirect for a save completed after account change',async()=>{
 let resolve!:()=>void;m.save.mockImplementation(()=>new Promise<void>(r=>{resolve=r;}));
 const {rerender}=render(<Page/>);await screen.findByLabelText('profile_name_label');fireEvent.click(screen.getByRole('button',{name:'profile_save'}));
 m.user={id:'two'};rerender(<Page/>);await screen.findByLabelText('profile_name_label');
 await act(async()=>resolve());expect(m.push).not.toHaveBeenCalled();expect(m.toast).not.toHaveBeenCalled();
});
it('allows another attempt with the same avatar after an upload error',async()=>{
 m.avatar.mockRejectedValue(new Error('offline'));const {container}=render(<Page/>);await screen.findByLabelText('profile_name_label');
 const input=container.querySelector<HTMLInputElement>('input[type=file]')!;const file=new File(['image'],'avatar.png',{type:'image/png'});
 fireEvent.change(input,{target:{files:[file]}});await waitFor(()=>expect(input).toBeEnabled());expect(input.value).toBe('');
 fireEvent.change(input,{target:{files:[file]}});await waitFor(()=>expect(m.avatar).toHaveBeenCalledTimes(2));
});
