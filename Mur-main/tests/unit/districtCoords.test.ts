import { describe, it, expect } from 'vitest';
import { nearestDistrict, DISTRICT_COORDS } from '../../lib/districtCoords';

describe('nearestDistrict', () => {
  it('дүүргийн яг төв цэг дээр тухайн дүүргээ зөв олно', () => {
    const [lat, lng] = DISTRICT_COORDS['Сүхбаатар'];
    expect(nearestDistrict(lat, lng)).toBe('Сүхбаатар');
  });

  it('өөр дүүргийн төвд ойрхон бол тухайн дүүргийг олно', () => {
    const [lat, lng] = DISTRICT_COORDS['Баянгол'];
    expect(nearestDistrict(lat, lng)).toBe('Баянгол');
  });

  it('9 дүүргийн аль нэгийг үргэлж буцаана', () => {
    const result = nearestDistrict(47.9, 106.9);
    expect(Object.keys(DISTRICT_COORDS)).toContain(result);
  });
});
