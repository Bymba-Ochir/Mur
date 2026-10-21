import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { SavedSearch } from '../../lib/listingService';
import type { PageResult } from '../../lib/pagination';
import type { Pet } from '../../lib/types';
const mocks = vi.hoisted(()=>({user:{id:'one'} as {id:string}|null,pets:vi.fn(),searches:vi.fn(),remove:vi.fn(),toast:vi.fn()}));
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('../../lib/i18n',()=>({useLanguage:()=>({lang:'en',t:(key:string)=>key})}));
vi.mock('../../components/Toast',()=>({useToast:()=>mocks.toast}));
vi.mock('../../components/LoginModal',()=>({default:()=>null}));
vi.mock('../../components/PetCard',()=>({default:()=>null}));
vi.mock('../../lib/listingService',()=>({fetchFavoritesPage:mocks.pets,fetchSavedSearchesPage:mocks.searches,deleteSavedSearch:mocks.remove}));
import SavedClient from '../../app/saved/SavedClient';
const row=(id:string):SavedSearch=>({id,name:id,status:null,petType:null,district:null,searchText:null,notify:true,createdAt:'2026-09-01T00:00:00Z'});
const page=<T,>(items:T[],hasMore=false,total=items.length):PageResult<T>=>({items,hasMore,page:0,total});
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:'one'};mocks.pets.mockReset().mockResolvedValue(page<Pet>([]));mocks.searches.mockReset().mockResolvedValue(page<SavedSearch>([]));mocks.remove.mockReset().mockResolvedValue(undefined);});
describe('saved page failures and account lifecycle',()=>{
 it('shows retry without misleading empty states after failure',async()=>{
  mocks.pets.mockRejectedValueOnce(new Error('offline'));
  render(<SavedClient/>);
  await screen.findByRole('alert');
  expect(screen.queryByText('saved_favorites_empty')).toBeNull();
  expect(screen.queryByText('saved_searches_empty')).toBeNull();
  fireEvent.click(screen.getByText('saved_retry'));
  await screen.findByText('saved_favorites_empty');
  expect(screen.queryByRole('alert')).toBeNull();
 });
 it('ignores delayed results from the previous account',async()=>{
  let resolve!:(rows:PageResult<SavedSearch>)=>void;
  mocks.searches.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
  const {rerender}=render(<SavedClient/>);
  await waitFor(()=>expect(mocks.searches).toHaveBeenCalledTimes(1));
  mocks.user={id:'two'};rerender(<SavedClient/>);
  await act(async()=>resolve(page([row('Private old search')])));
  expect(screen.queryByText('Private old search')).toBeNull();
 });
 it('preserves the search and unlocks deletion when the request fails',async()=>{
  mocks.searches.mockResolvedValue(page([row('Keep me')]));
  mocks.remove.mockRejectedValueOnce(new Error('offline'));
  render(<SavedClient/>);
  fireEvent.click(await screen.findByRole('button',{name:'saved_delete_label: Keep me'}));
  await waitFor(()=>expect(mocks.toast).toHaveBeenCalledWith('offline','error'));
  expect(screen.getByText('Keep me')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'saved_delete_label: Keep me'})).toBeEnabled();
 });
 it('prevents overlapping deletes and does not toast for an account that signed out',async()=>{
  let resolve!:()=>void;
  mocks.searches.mockResolvedValue(page([row('First'),row('Second')]));
  mocks.remove.mockImplementationOnce(()=>new Promise<void>(r=>{resolve=r;}));
  const {rerender}=render(<SavedClient/>);
  fireEvent.click(await screen.findByRole('button',{name:'saved_delete_label: First'}));
  fireEvent.click(screen.getByRole('button',{name:'saved_delete_label: Second'}));
  expect(mocks.remove).toHaveBeenCalledTimes(1);
  mocks.user=null;rerender(<SavedClient/>);
  await act(async()=>resolve());
  expect(mocks.toast).not.toHaveBeenCalled();
 });
});
