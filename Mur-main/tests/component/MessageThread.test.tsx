import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Message } from '../../lib/types';
const mocks=vi.hoisted(()=>({user:{id:'one'} as {id:string}|null,t:(key:string)=>key,send:vi.fn(),messages:vi.fn()}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({lang:'en',t:mocks.t})}));
vi.mock('../../lib/chatService',()=>({fetchConversationById:async(id:string)=>({id,petId:'pet',initiatorId:'one',ownerId:'two',initiatorEmail:'one@example.com',ownerEmail:'two@example.com',createdAt:'2026-09-01'}),fetchMessages:mocks.messages,sendMessage:mocks.send,subscribeToMessages:()=>()=>{},otherParticipant:()=> 'other@example.com',markConversationRead:async()=>{}}));
import MessageThreadClient from '../../app/messages/[id]/MessageThreadClient';
const message=(content:string):Message=>({id:content,conversationId:'a',senderId:'one',content,readAt:null,createdAt:'2026-09-01T00:00:00Z'});
beforeEach(()=>{mocks.user={id:'one'};mocks.messages.mockReset().mockResolvedValue([]);mocks.send.mockReset();Element.prototype.scrollIntoView=vi.fn();});
describe('message thread isolation',()=>{
 it('clears the old draft when changing conversations',async()=>{
  const {rerender}=render(<MessageThreadClient id="a"/>);
  fireEvent.change(await screen.findByRole('textbox'),{target:{value:'Old draft'}});
  rerender(<MessageThreadClient id="b"/>);
  expect(await screen.findByRole('textbox')).toHaveValue('');
 });
 it('ignores a pending send response after changing conversations',async()=>{
  let resolve!:(value:Message)=>void;
  mocks.send.mockImplementation(()=>new Promise(r=>{resolve=r;}));
  const {rerender}=render(<MessageThreadClient id="a"/>);
  fireEvent.change(await screen.findByRole('textbox'),{target:{value:'Old send'}});
  fireEvent.click(screen.getByRole('button',{name:'chat_submit'}));
  rerender(<MessageThreadClient id="b"/>);
  await screen.findByRole('textbox');
  await act(async()=>resolve(message('Old send')));
  expect(screen.queryByText('Old send')).toBeNull();
 });
 it('restores a failed draft and retries it successfully',async()=>{
  mocks.send.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(message('Retry me'));
  render(<MessageThreadClient id="a"/>);
  fireEvent.change(await screen.findByRole('textbox'),{target:{value:'Retry me'}});
  fireEvent.click(screen.getByRole('button',{name:'chat_submit'}));
  await screen.findByRole('alert');
  expect(screen.getByRole('textbox')).toHaveValue('Retry me');
  fireEvent.click(screen.getByRole('button',{name:'thread_retry_send'}));
  await screen.findByText('Retry me',{selector:'p'});
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(mocks.send).toHaveBeenCalledTimes(2);
 });
 it('removes messages immediately when the account changes',async()=>{
  mocks.messages.mockResolvedValueOnce([message('Private message')]);
  const {rerender}=render(<MessageThreadClient id="a"/>);
  await screen.findByText('Private message');
  mocks.user={id:'three'};rerender(<MessageThreadClient id="a"/>);
  expect(screen.queryByText('Private message')).toBeNull();
  await screen.findByRole('textbox');
 });
});
