// lib/districts.ts
// Улаанбаатарын 9 дүүрэг — нэг үнэн эх сурвалж. PetForm, listings, PetDetailClient
// өмнө тус тусдаа давхарласан массивтай байсан — одоо эндээс import хийнэ.
export const DISTRICTS = [
  'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
] as const;

export type District = (typeof DISTRICTS)[number];
