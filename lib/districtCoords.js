// lib/districtCoords.js
// Улаанбаатарын 9 дүүргийн ойролцоо төв координат (маш нарийвчлалтай биш,
// зөвхөн "Миний байршлыг ашиглах" товчны хувьд хамгийн ойрхон дүүргийг
// таамаглахад хангалттай). Гадаад API/зардал шаардахгүй, бүрэн клиент талд.
export const DISTRICT_COORDS = {
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

function distance([lat1, lng1], [lat2, lng2]) {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
}

export function nearestDistrict(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const [name, coords] of Object.entries(DISTRICT_COORDS)) {
    const d = distance([lat, lng], coords);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}
