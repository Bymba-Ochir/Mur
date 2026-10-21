import { describe, expect, it } from 'vitest';
import { assertDateOrder, cleanText, optionalDecimal, optionalInteger, optionalIsoDate, requireMongolianPhone } from '../../lib/inputValidation';

describe('inputValidation', () => {
  it('текстийг trim хийж олон зайг нэг болгоно', () => {
    expect(cleanText('  Баянзүрх   13-р хороо  ', 100, 'Байршил')).toBe('Баянзүрх 13-р хороо');
  });

  it('Монгол утсыг 8 оронтойгоор хадгална', () => {
    expect(requireMongolianPhone('+976 99 11 22 33')).toBe('99112233');
    expect(() => requireMongolianPhone('9911')).toThrow('яг 8 оронтой');
  });

  it('integer DB талбарт бутархай болон NaN оруулахгүй', () => {
    expect(optionalInteger('15000', { min: 0, max: 100000, label: 'Үнэ' })).toBe(15000);
    expect(() => optionalInteger('1.5', { min: 0, max: 100000, label: 'Үнэ' })).toThrow('бүхэл тоо');
    expect(() => optionalInteger('abc', { min: 0, max: 100000, label: 'Үнэ' })).toThrow('бүхэл тоо');
  });

  it('жин хоёр орны нарийвчлалтай байна', () => {
    expect(optionalDecimal('4.25', { min: 0, max: 999.99, label: 'Жин' })).toBe(4.25);
    expect(() => optionalDecimal('4.256', { min: 0, max: 999.99, label: 'Жин' })).toThrow('2 орны');
  });

  it('огнооны формат болон дарааллыг шалгана', () => {
    expect(optionalIsoDate('2026-08-27')).toBe('2026-08-27');
    expect(() => optionalIsoDate('2026-02-30')).toThrow('хүчинтэй огноо');
    expect(() => assertDateOrder('2026-08-28', '2026-08-27')).toThrow('өмнө');
  });
});
