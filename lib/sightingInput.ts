import { cleanText, InputValidationError, optionalCoordinate } from './inputValidation';

export const SIGHTING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readCoordinate(value: unknown, kind: 'lat' | 'lng') {
  if (value != null && typeof value !== 'number') throw new InputValidationError('Газрын зургийн координат буруу байна.');
  return optionalCoordinate(value, kind);
}

function readSightedAt(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new InputValidationError('Харсан огноо, цаг буруу байна.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value || date.getTime() > Date.now()) {
    throw new InputValidationError('Харсан огноо, цаг хүчинтэй бөгөөд ирээдүйд биш байх ёстой.');
  }
  return value;
}

export function readSightingDetails(body: Record<string, unknown>) {
  if (typeof body.petId !== 'string' || !SIGHTING_UUID.test(body.petId)) {
    throw new InputValidationError('Зарын дугаар буруу байна.');
  }
  const message = cleanText(typeof body.message === 'string' ? body.message : '', 1000, 'Харсан мэдээлэл', true);
  const place = cleanText(typeof body.place === 'string' ? body.place : '', 300, 'Байршил') || null;
  const lat = readCoordinate(body.lat, 'lat');
  const lng = readCoordinate(body.lng, 'lng');
  if ((lat === null) !== (lng === null)) throw new InputValidationError('Газрын зураг дээр байршлаа дахин сонгоно уу.');
  return { petId: body.petId.toLowerCase(), message, place, lat, lng, sightedAt: readSightedAt(body.sightedAt) };
}
