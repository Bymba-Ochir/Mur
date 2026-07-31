// lib/confetti.js
//
// Хөнгөн, гадаад сан шаардахгүй confetti эффект. Зөвхөн жинхэнэ баяр хөөрийн
// мөч (амьтан олдлоо, хандив амжилттай төлөгдлөө) үед л ашиглана — хэт олон
// газар хэрэглэвэл утга учраа алддаг тул зориудаар цөөхөн газар.
const COLORS = ['#E07A3E', '#3D8C68', '#CE5642', '#17414D', '#F0A15C'];

export function fireConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const size = 5 + Math.random() * 6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const startX = 50 + (Math.random() * 50 - 25);
    const tx = `${Math.random() * 320 - 160}px`;
    const ty = `${220 + Math.random() * 220}px`;
    const rot = `${Math.floor(Math.random() * 360)}deg`;
    const delay = `${Math.random() * 0.15}s`;

    p.style.cssText = `
      position:absolute; left:${startX}%; top:30%;
      width:${size}px; height:${size * 0.42}px; background:${color};
      border-radius:2px; opacity:1;
      animation: confetti-fall 1.05s cubic-bezier(.2,.7,.3,1) ${delay} forwards;
      --tx:${tx}; --ty:${ty}; --rot:${rot};
    `;
    container.appendChild(p);
  }

  setTimeout(() => container.remove(), 1500);
}
