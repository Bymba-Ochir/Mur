import { describe, expect, it } from 'vitest';
import { getBreedLabel, getPetBreeds } from '../../lib/petBreeds';

describe('petBreeds', () => {
  it('returns dog-specific breeds', () => {
    const values = getPetBreeds('Нохой').map((breed) => breed.value);
    expect(values).toContain('Монгол банхар');
    expect(values).toContain('Голден ретривер');
    expect(values).not.toContain('Мэйн Кун');
  });

  it('returns cat-specific breeds', () => {
    const values = getPetBreeds('Муур').map((breed) => breed.value);
    expect(values).toContain('Монгол гэрийн муур');
    expect(values).toContain('Мэйн Кун');
    expect(values).not.toContain('Герман хоньч');
  });

  it('localizes canonical breed values', () => {
    expect(getBreedLabel('Монгол банхар', 'en')).toBe('Mongolian Bankhar');
    expect(getBreedLabel('Монгол банхар', 'mn')).toBe('Монгол банхар');
  });

  it('keeps an unknown legacy value unchanged', () => {
    expect(getBreedLabel('Custom breed', 'en')).toBe('Custom breed');
  });
});
