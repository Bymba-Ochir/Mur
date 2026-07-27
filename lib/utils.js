// lib/utils.js
export function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  const first = digits.slice(0, 2);
  const last = digits.slice(-2);
  const stars = '*'.repeat(digits.length - 4);
  return `${first}${stars}${last}`;
}
