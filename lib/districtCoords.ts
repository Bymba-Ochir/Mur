// lib/districtCoords.ts
// Улаанбаатарын 9 дүүргийн ойролцоо төв координат (маш нарийвчлалтай биш,
// зөвхөн "Миний байршлыг ашиглах" товчны хувьд хамгийн ойрхон дүүргийг
// таамаглахад хангалттай). Гадаад API/зардал шаардахгүй, бүрэн клиент талд.
import { DISTRICTS } from './districts';
import type { District } from './districts';

export const DISTRICT_COORDS: Record<District, [number, number]> = {
  'Сүхбаатар': [47.9188, 106.9177],
  'Чингэлтэй': [47.9280, 106.8950],
  'Баянгол': [47.9050, 106.8550],
  'Баянзүрх': [47.9200, 106.9650],
  'Хан-Уул': [47.8700, 106.9100],
  'Сонгинохайрхан': [47.9300, 106.7800],
  'Налайх': [47.7700, 107.2500],
  'Багануур': [47.8200, 108.3000],
  'Багахангай': [47.5500, 106.9000],
};

function distance(a: [number, number], b: [number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/**
 * Тухайн координатод хамгийн ойрхон дүүргийг буцаана.
 * Жагсаалт хоосон биш тогтмол тул үргэлж 9 дүүргийн нэгийг буцаана.
 */
export function nearestDistrict(lat: number, lng: number): District {
  let best: District = DISTRICTS[0];
  let bestDist = Infinity;
  for (const name of DISTRICTS) {
    const d = distance([lat, lng], DISTRICT_COORDS[name]);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}
