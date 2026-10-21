import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ConversationPreview } from '../../lib/types';
const mocks=vi.hoisted(()=>({user:{id:'one'} as {id:string}|null,fetch:vi.fn()}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({lang:'en',t:(key:string)=>key})}));
vi.mock('../../lib/chatService',()=>({fetchConversationList:mocks.fetch}));
vi.mock('../../app/assistant/AssistantClient',()=>({default:()=>null}));
vi.mock('../../components/LoginModal',()=>({default:()=>null}));
import MessagesPage from '../../app/messages/page';
const row=(content:string):ConversationPreview=>({id:content,petId:'pet',initiatorId:'one',ownerId:'other',initiatorName:'One',ownerName:'Other',createdAt:'2026-09-01T00:00:00Z',pet:null,unreadCount:1,lastMessage:{id:content,conversationId:content,senderId:'other',content,readAt:null,createdAt:'2026-09-01T00:00:00Z'}});
beforeEach(()=>{mocks.user={id:'one'};mocks.fetch.mockReset().mockResolvedValue([]);window.history.replaceState(null,'','/messages');});
describe('conversation list lifecycle',()=>{
 it('removes the previous account list immediately',async()=>{
  mocks.fetch.mockResolvedValueOnce([row('Private preview')]);
  const {rerender}=render(<MessagesPage/>);
  await screen.findByText('Private preview');
  mocks.user={id:'two'};rerender(<MessagesPage/>);
  expect(screen.queryByText('Private preview')).toBeNull();
  await screen.findByText('chat_none');
 });
 it('ignores older responses when focus requests overlap',async()=>{
  let resolve!:(rows:ConversationPreview[])=>void;
  mocks.fetch.mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockResolvedValueOnce([row('Newest preview')]);
  render(<MessagesPage/>);
  fireEvent.focus(window);
  await screen.findByText('Newest preview');
  await act(async()=>resolve([row('Old preview')]));
  expect(screen.queryByText('Old preview')).toBeNull();
  expect(screen.getByText('Newest preview')).toBeInTheDocument();
 });
 it('recovers from a load failure when connectivity returns',async()=>{
  mocks.fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([row('Recovered')]);
  render(<MessagesPage/>);
  await screen.findByRole('alert');
  fireEvent(window,new Event('online'));
  await screen.findByText('Recovered');
  expect(screen.queryByRole('alert')).toBeNull();
 });
 it('removes refresh listeners after unmount',async()=>{
  const {unmount}=render(<MessagesPage/>);
  await screen.findByText('chat_none');
  unmount();
  fireEvent.focus(window);fireEvent(window,new Event('online'));
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(1));
 });
});
