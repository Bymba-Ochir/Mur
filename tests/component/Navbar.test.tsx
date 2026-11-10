import { describe,it,expect,vi,beforeEach,afterEach } from 'vitest';
import { render,screen,fireEvent,waitFor,act,within } from '@testing-library/react';
import type { ReactNode } from 'react';
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
import Footer from '../../components/Footer';
import { FeedbackProvider } from '../../components/FeedbackButton';
import { ToastProvider } from '../../components/Toast';
import { LanguageProvider } from '../../lib/i18n';

function Providers({ children }: { children: ReactNode }) {
  return <LanguageProvider><ToastProvider><FeedbackProvider>{children}</FeedbackProvider></ToastProvider></LanguageProvider>;
}
beforeEach(()=>{
 mocks.user={id:'test',email:'test@example.com'}; mocks.admin.mockReset().mockResolvedValue(false); mocks.count.mockReset().mockResolvedValue(0);
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),0));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
});
afterEach(()=>vi.unstubAllGlobals());
describe('account menu keyboard',()=>{
 it('opens at the first item, navigates to the end, and restores focus on Escape',async()=>{
  render(<Navbar/>, { wrapper: Providers });
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
  const {rerender,container}=render(<Navbar/>, { wrapper: Providers });
  fireEvent.click(screen.getByRole('button', { name: 'Цэсийг нээх' }));
  mocks.user={id:'second',email:'second@example.com'};
  rerender(<Navbar/>);
  await act(async()=>{resolveOld(true);});
  expect(container.querySelector('.mobile-menu-account a[href="/admin"]')).toBeNull();
 });
 it('removes admin UI immediately on logout',async()=>{
  mocks.admin.mockResolvedValue(true);
  const {rerender,container}=render(<Navbar/>, { wrapper: Providers });
  fireEvent.click(screen.getByRole('button', { name: 'Цэсийг нээх' }));
  await waitFor(()=>expect(container.querySelector('.mobile-menu-account a[href="/admin"]')).not.toBeNull());
  mocks.user=null;
  rerender(<Navbar/>);
  expect(container.querySelector('.mobile-menu-account a[href="/admin"]')).toBeNull();
 });
 it('handles failed role and notification requests',async()=>{
  mocks.admin.mockRejectedValue(new Error('offline')); mocks.count.mockRejectedValue(new Error('offline'));
  const {container}=render(<Navbar/>, { wrapper: Providers });
  fireEvent.click(screen.getByRole('button', { name: 'Цэсийг нээх' }));
  await act(async()=>{});
  expect(container.querySelector('.user-pill')).not.toBeNull();
  expect(container.querySelector('.mobile-menu-account a[href="/admin"]')).toBeNull();
  expect(container.querySelector('.notification-badge')).toBeNull();
 });
});

it('opens feedback from the header and preserves the draft on reopen', async () => {
  mocks.user = null;
  render(<><Navbar /><Footer /></>, { wrapper: Providers });
  const navButton = within(screen.getByRole('banner')).getByRole('button', { name: 'Санал хүсэлт' });
  navButton.focus();
  fireEvent.click(navButton);
  const dialog = screen.getByRole('dialog', { name: 'Санал хүсэлт' });
  fireEvent.change(within(dialog).getByLabelText('Таны санал'), { target: { value: 'Saved draft' } });
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(navButton).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  expect(within(screen.getByRole('contentinfo')).queryByRole('button', { name: 'Санал хүсэлт' })).not.toBeInTheDocument();
  fireEvent.click(navButton);
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByLabelText('Таны санал')).toHaveValue('Saved draft');
});
