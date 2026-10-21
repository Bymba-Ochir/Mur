import { describe,it,expect } from 'vitest';
import { requireMongolianPhone, optionalDecimal } from '../../lib/inputValidation';
describe('input edge cases',()=>{
 it('preserves local phone numbers that start with 976',()=>{
  expect(requireMongolianPhone('97612345')).toBe('97612345');
  expect(requireMongolianPhone('+976 9761 2345')).toBe('97612345');
  expect(()=>requireMongolianPhone('9761234')).toThrow();
 });
 it('accepts two decimal values despite binary rounding',()=>{
  expect(optionalDecimal('1.1',{max:100})).toBe(1.1);
  expect(optionalDecimal('0.29',{max:100})).toBe(0.29);
  expect(()=>optionalDecimal('1.123',{max:100})).toThrow();
 });
});
