import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AppNotification } from '../../lib/workflowService';
import type { PageResult } from '../../lib/pagination';
const mocks = vi.hoisted(() => ({ user: {id:'one'} as {id:string}|null, fetch:vi.fn(), mark:vi.fn(), all:vi.fn(), count:vi.fn(), unread:vi.fn(), push:vi.fn(), toast:vi.fn(), refresh:()=>{} }));
vi.mock('next/navigation',()=>({useRouter:()=>({push:mocks.push})}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({lang:'en',t:(key:string)=>key})}));
vi.mock('../../components/Toast',()=>({useToast:()=>mocks.toast}));
vi.mock('../../components/LoginModal',()=>({default:()=>null}));
vi.mock('../../lib/workflowService',()=>({fetchNotificationsPage:mocks.fetch,markNotificationRead:mocks.mark,markAllNotificationsRead:mocks.all,notificationCount:mocks.count,unreadNotificationCount:mocks.unread,subscribeToNotifications:(_id:string,cb:()=>void)=>{mocks.refresh=cb;return ()=>{};}}));
import NotificationsClient from '../../app/notifications/NotificationsClient';
const row=(title:string):AppNotification=>({id:title,title,body:'body',type:'message',href:'/messages',readAt:null,createdAt:'2026-09-01T00:00:00Z'});
const page=(items:AppNotification[],hasMore=false,total=items.length):PageResult<AppNotification>=>({items,hasMore,page:0,total});
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:'one'};mocks.fetch.mockReset().mockResolvedValue(page([]));mocks.count.mockReset().mockResolvedValue(0);mocks.unread.mockReset().mockResolvedValue(0);mocks.mark.mockReset().mockResolvedValue(undefined);mocks.all.mockReset().mockResolvedValue(undefined);});
describe('notification account and request lifecycle',()=>{
 it('does not display old account responses',async()=>{
  let resolve!: (rows:PageResult<AppNotification>)=>void;
  mocks.fetch.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
  const {rerender}=render(<NotificationsClient/>);
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(1));
  mocks.user={id:'two'}; rerender(<NotificationsClient/>);
  await act(async()=>resolve(page([row('Old account')])));
  expect(screen.queryByText('Old account')).toBeNull();
 });
 it('keeps the newest response when realtime requests overlap',async()=>{
  let resolve!: (rows:PageResult<AppNotification>)=>void;
  mocks.fetch.mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockResolvedValueOnce(page([row('Newest')]));
  render(<NotificationsClient/>);
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(1));
  await act(async()=>mocks.refresh());
  await screen.findByText('Newest');
  await act(async()=>resolve(page([row('Stale')])));
  expect(screen.queryByText('Stale')).toBeNull();
  expect(screen.getByText('Newest')).toBeInTheDocument();
 });
 it('does not navigate after account changes during a pending read',async()=>{
  let resolve!:()=>void;
  mocks.fetch.mockResolvedValue(page([row('Open me')]));
  mocks.mark.mockImplementationOnce(()=>new Promise<void>(r=>{resolve=r;}));
  const {rerender}=render(<NotificationsClient/>);
  fireEvent.click(await screen.findByText('Open me'));
  mocks.user=null;rerender(<NotificationsClient/>);
  await act(async()=>resolve());
  expect(mocks.push).not.toHaveBeenCalled();
 });
 it('reloads server state after marking all instead of marking new arrivals locally',async()=>{
  mocks.fetch.mockResolvedValueOnce(page([row('First')])).mockResolvedValueOnce(page([row('New arrival')]));
  mocks.unread.mockResolvedValue(1);
  render(<NotificationsClient/>);
  fireEvent.click(await screen.findByText('notifications_mark_all'));
  await screen.findByText('New arrival');
  expect(screen.getByText('notifications_unread_label')).toBeInTheDocument();
  await waitFor(()=>expect(mocks.all).toHaveBeenCalledTimes(1));
 });
});
