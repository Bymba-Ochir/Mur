import { describe,it,expect,vi,afterEach } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import PetImageGallery from '../../components/PetImageGallery';
import ShareButtons from '../../components/ShareButtons';
import { LanguageProvider } from '../../lib/i18n';
afterEach(()=>vi.restoreAllMocks());
const view=(images:string[]) => <LanguageProvider><PetImageGallery images={images} alt="pet" /></LanguageProvider>;
describe('gallery',()=>{
 it('keeps a visible image when the selected photo is removed',()=>{
  const {rerender}=render(view(['/one.png','/two.png']));
  fireEvent.keyDown(screen.getByRole('group'),{key:'ArrowRight'});
  expect(screen.getByRole('img')).toHaveAttribute('alt',expect.stringContaining('2'));
  rerender(view(['/one.png']));
  expect(screen.getByRole('img')).toHaveAttribute('alt',expect.stringContaining('1'));
 });
 it('distinguishes vertical scrolling from horizontal swiping',()=>{
  render(view(['/one.png','/two.png']));const g=screen.getByRole('group');
  fireEvent.touchStart(g,{touches:[{clientX:200,clientY:200}]});
  fireEvent.touchEnd(g,{changedTouches:[{clientX:150,clientY:400}]});
  expect(screen.getByRole('img')).toHaveAttribute('alt',expect.stringContaining('1'));
  fireEvent.touchStart(g,{touches:[{clientX:200,clientY:200}]});
  fireEvent.touchEnd(g,{changedTouches:[{clientX:100,clientY:210}]});
  expect(screen.getByRole('img')).toHaveAttribute('alt',expect.stringContaining('2'));
 });
});
describe('sharing',()=>{
 it('shows a selectable URL when clipboard permission fails',async()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockRejectedValue(new Error('denied'))}});
  render(<LanguageProvider><ShareButtons url="https://example.com/pets/one" title="pet"/></LanguageProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Холбоос хуулах'}));
  await waitFor(()=>expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByRole('textbox')).toHaveValue('https://example.com/pets/one');
 });
 it('copying does not submit its enclosing form',async()=>{
  const submit=vi.fn(e=>e.preventDefault());
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}});
  render(<LanguageProvider><form onSubmit={submit}><ShareButtons url="https://example.com" title="pet"/></form></LanguageProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Холбоос хуулах'}));
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Хуулагдлаа'));
  expect(submit).not.toHaveBeenCalled();
 });
});
