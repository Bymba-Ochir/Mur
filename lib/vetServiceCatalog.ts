import type { VetService } from './types';

export const VET_SERVICE_ID_BY_NAME: Record<VetService, string> = {
  'Үзлэг': 'exam',
  'Вакцин': 'vaccine',
  'Мэс засал': 'surgery',
  'Шүд арчилгаа': 'dental',
  'Рентген': 'xray',
  'ЭХО': 'ultrasound',
  'Цусны шинжилгээ': 'blood-test',
  'Микрочип': 'microchip',
  'Туулгалт': 'deworming',
  'Арчилгаа': 'grooming',
};

export const VET_SERVICE_NAME_BY_ID = Object.fromEntries(
  Object.entries(VET_SERVICE_ID_BY_NAME).map(([name, id]) => [id, name]),
) as Record<string, VetService>;

export function vetServiceId(service: VetService): string {
  return VET_SERVICE_ID_BY_NAME[service];
}

export function vetServiceName(serviceId: string | null | undefined, legacyName?: unknown): VetService {
  const normalized = serviceId ? VET_SERVICE_NAME_BY_ID[serviceId] : undefined;
  if (normalized) return normalized;
  if (typeof legacyName === 'string' && legacyName in VET_SERVICE_ID_BY_NAME) return legacyName as VetService;
  return 'Үзлэг';
}
