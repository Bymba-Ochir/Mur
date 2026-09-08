import { describe,it,expect,vi,beforeEach,afterEach } from 'vitest';
import { render,screen,fireEvent,waitFor,act } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ user: { id: 'test', email: 'test@example.com' } as { id:string;email:string } | null, admin: vi.fn(), count: vi.fn() }));
vi.mock('next/navigation',()=>({usePathname:()=>'/'}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,logout:vi.fn()})}));
vi.mock('../../lib/adminService',()=>({isAdmin:mocks.admin}));
vi.mock('../../lib/workflowService',()=>({unreadNotificationCount:mocks.count,subscribeToNotifications:()=>()=>{}}));
vi.mock('../../components/DonateButton',()=>({default:()=>null}));
vi.mock('../../components/ThemeToggle',()=>({default:()=>null}));
vi.mock('../../components/LanguageToggle',()=>({default:()=>null}));
vi.mock('../../components/LoginModal',()=>({default:()=>null}));
import Navbar from '../../components/Navbar';
import { LanguageProvider } from '../../lib/i18n';
beforeEach(()=>{
 mocks.user={id:'test',email:'test@example.com'}; mocks.admin.mockReset().mockResolvedValue(false); mocks.count.mockReset().mockResolvedValue(0);
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),0));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
});
afterEach(()=>vi.unstubAllGlobals());
describe('account menu keyboard',()=>{
 it('opens at the first item, navigates to the end, and restores focus on Escape',async()=>{
  render(<LanguageProvider><Navbar/></LanguageProvider>);
  const trigger=document.querySelector<HTMLButtonElement>('.user-pill')!;
  fireEvent.keyDown(trigger,{key:'ArrowDown'});
  await waitFor(()=>expect(screen.getAllByRole('menuitem')[0]).toHaveFocus());
  const items=screen.getAllByRole('menuitem');
  fireEvent.keyDown(items[0],{key:'End'});
  expect(items[items.length-1]).toHaveFocus();
  fireEvent.keyDown(items[items.length-1],{key:'Escape'});
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
 });
});

describe('navbar account state',()=>{
 it('ignores a previous account response after switching accounts',async()=>{
  let resolveOld!: (value:boolean)=>void;
  mocks.admin.mockImplementationOnce(()=>new Promise<boolean>((resolve)=>{resolveOld=resolve;}));
  const {rerender,container}=render(<LanguageProvider><Navbar/></LanguageProvider>);
  mocks.user={id:'second',email:'second@example.com'};
  rerender(<LanguageProvider><Navbar/></LanguageProvider>);
  await act(async()=>{resolveOld(true);});
  expect(container.querySelector('.icon-rail-btn.is-admin')).toBeNull();
 });
 it('removes admin UI immediately on logout',async()=>{
  mocks.admin.mockResolvedValue(true);
  const {rerender,container}=render(<LanguageProvider><Navbar/></LanguageProvider>);
  await waitFor(()=>expect(container.querySelector('.icon-rail-btn.is-admin')).not.toBeNull());
  mocks.user=null;
  rerender(<LanguageProvider><Navbar/></LanguageProvider>);
  expect(container.querySelector('.icon-rail-btn.is-admin')).toBeNull();
 });
 it('handles failed role and notification requests',async()=>{
  mocks.admin.mockRejectedValue(new Error('offline')); mocks.count.mockRejectedValue(new Error('offline'));
  const {container}=render(<LanguageProvider><Navbar/></LanguageProvider>);
  await act(async()=>{});
  expect(container.querySelector('.user-pill')).not.toBeNull();
  expect(container.querySelector('.icon-rail-btn.is-admin')).toBeNull();
  expect(container.querySelector('.notification-badge')).toBeNull();
 });
});
