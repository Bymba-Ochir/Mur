import { describe, it, expect } from 'vitest';
import { maskPhone } from '../../lib/utils';

describe('maskPhone', () => {
  it('масклаж, эхний 2 сүүлийн 2 оронг үлдээнэ', () => {
    expect(maskPhone('99112233')).toBe('99****33');
  });

  it('зай орсон дугаарыг зөв цэвэрлэж масклана', () => {
    expect(maskPhone('9911 2233')).toBe('99****33');
  });

  it('4 оронгоос богино дугаарыг маскладаггүй', () => {
    expect(maskPhone('123')).toBe('123');
  });

  it('хоосон/undefined утгад хоосон мөр буцаана', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone(undefined)).toBe('');
  });

  it('маскны урт нь digit тооны уртаас хамаарна', () => {
    expect(maskPhone('99112233')).toHaveLength(8);
  });
});
