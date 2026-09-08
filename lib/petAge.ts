// Ages remain strings in the existing schema. Never guess the unit of legacy numbers.
export function validatePetAge(value: string): string {
  const age = value.trim();
  if (!age) return '';
  if (!/\d/.test(age) && /^(тодорхойгүй|unknown)$/i.test(age)) return age;
  if (!/\d/.test(age) || !/(жил|сар|нас|сартай|настай|year|month)/i.test(age)) {
    throw new Error('Насыг нэгжтэй бичнэ үү: 2 жил, 6 сар / Include an age unit: 2 years, 6 months.');
  }
  return age;
}
export function formatPetAge(value: string, lang: 'mn' | 'en' = 'mn'): string {
  const age = value.trim();
  if (!age) return '';
  if (/^\d+(?:[.,]\d+)?$/.test(age)) return `${age} (${lang === 'mn' ? 'нэгж тодорхойгүй' : 'unit unspecified'})`;
  return age;
}
