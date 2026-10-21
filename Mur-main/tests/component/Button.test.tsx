import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import Button from '../../components/ui/Button';
describe('shared Button behavior',()=>{
 it('forwards disclosure and toggle accessibility state',()=>{
  render(<Button aria-expanded={true} aria-controls="panel" aria-pressed={true}>Open</Button>);
  const b=screen.getByRole('button');
  expect(b).toHaveAttribute('aria-expanded','true');
  expect(b).toHaveAttribute('aria-controls','panel');
  expect(b).toHaveAttribute('aria-pressed','true');
 });
 it.each(['link','anchor'] as const)('prevents disabled %s navigation and callbacks',(as)=>{
  const click=vi.fn();render(<Button as={as} href="/clinics" disabled onClick={click}>Go</Button>);
  const link=screen.getByRole('link');fireEvent.click(link);
  expect(click).not.toHaveBeenCalled();expect(link).not.toHaveAttribute('href');
  expect(link).toHaveAttribute('aria-disabled','true');expect(link).toHaveAttribute('tabindex','-1');
 });
 it('defaults to a non-submit button and invokes enabled callbacks',()=>{
  const click=vi.fn();render(<Button onClick={click}>Save</Button>);
  const b=screen.getByRole('button');fireEvent.click(b);
  expect(b).toHaveAttribute('type','button');expect(click).toHaveBeenCalledOnce();
 });
 it('does not activate a file input through a disabled label',()=>{
  const click=vi.fn();render(<><Button as="label" htmlFor="upload" disabled>Upload</Button><input id="upload" type="file" onClick={click}/></>);
  fireEvent.click(screen.getByText('Upload'));expect(click).not.toHaveBeenCalled();
 });
});
