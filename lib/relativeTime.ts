// lib/relativeTime.ts
export function relativeTime(dateString: string | null | undefined, lang: 'mn' | 'en' = 'mn'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (lang === 'en') {
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} months ago`;
    return date.toLocaleDateString('en-US');
  }

  if (diffMin < 1) return 'Дөнгөж сая';
  if (diffMin < 60) return `${diffMin} минутын өмнө`;
  if (diffHour < 24) return `${diffHour} цагийн өмнө`;
  if (diffDay === 1) return 'Өчигдөр';
  if (diffDay < 7) return `${diffDay} хоногийн өмнө`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} долоо хоногийн өмнө`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} сарын өмнө`;
  return date.toLocaleDateString('mn-MN');
}
