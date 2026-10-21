import { describe, expect, it } from 'vitest';
import { isMissingNormalizedTable, legacyPhotoUrls } from '../../lib/photoModel';
import { vetServiceId, vetServiceName } from '../../lib/vetServiceCatalog';

describe('database normalization compatibility helpers', () => {
  it('preserves legacy photo order while the normalized child table is not deployed', () => {
    expect(legacyPhotoUrls({ photo_url: 'primary.jpg', photo_urls: ['a.jpg', 'b.jpg'] })).toEqual(['a.jpg', 'b.jpg']);
    expect(legacyPhotoUrls({ photo_url: 'primary.jpg' })).toEqual(['primary.jpg']);
  });

  it('recognizes schema-cache/table-missing rollout errors', () => {
    expect(isMissingNormalizedTable({ code: '42P01', message: 'relation does not exist' })).toBe(true);
    expect(isMissingNormalizedTable({ code: 'PGRST205', message: 'table not in schema cache' })).toBe(true);
    expect(isMissingNormalizedTable({ code: '42501', message: 'permission denied' })).toBe(false);
  });

  it('maps appointment service labels to normalized service identifiers', () => {
    expect(vetServiceId('Вакцин')).toBe('vaccine');
    expect(vetServiceName('surgery')).toBe('Мэс засал');
    expect(vetServiceName(undefined, 'Рентген')).toBe('Рентген');
  });
});
