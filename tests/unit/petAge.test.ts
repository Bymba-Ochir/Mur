import { it, expect } from 'vitest';
import { formatPetAge, validatePetAge } from '../../lib/petAge';
import { parseListingFilters } from '../../lib/useListingFilters';
it('does not invent units for legacy ages', () => { expect(formatPetAge('22')).toBe('22 (нэгж тодорхойгүй)'); expect(formatPetAge('22','en')).toBe('22 (unit unspecified)'); });
it('requires age units but accepts unknown or blank', () => { expect(()=>validatePetAge('22')).toThrow(); expect(validatePetAge('6 сар')).toBe('6 сар'); expect(validatePetAge('2 years')).toBe('2 years'); expect(validatePetAge('')).toBe(''); });
it('ignores invalid filters from shared URLs', () => { expect(parseListingFilters('?status=bad&type=wrong&district=no')).toEqual({ status:'',type:'',district:'',search:'' }); });
