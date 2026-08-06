---
name: design-system
description: МӨР-ийн дизайн систем — загвар, өнгө, фонт, token
---

# МӨР Design System

## Өнгөний палет ("Steppe night → ember trail")

```
Primary:    #17414D (гүн ногоон-хөх — шөнийн тэнгэр)
Accent:     #E77A3E (улбар шар — огтоос, найдвар)
Brand:      #2B6575 (дулаан хөх — лац, итгэл)
Alert:      #DC2626 (улаан — аюул)
Success:    #16A34A (ногоон — амжилт)
Muted:      #888888 (саарал — дэд текст)
Overcast:   #F5F5F5 (цайвар саарал — дэвсгэр)
Ink:        #1A1A1A (хар — үндсэн текст)
```

## Фонт хослол

| Зорилго | Фонт | CSS тэмдэгт |
|---|---|---|
| Дэлгэрэнгүй гарчиг | Unbounded | `var(--font-display)` |
| Үндсэн текст | Inter | `var(--font-body)` |
| Badge/Timestamp | JetBrains Mono | `var(--font-mono)` |

## Token систем

### Зай (Spacing)
```css
--sp-1: 4px    --sp-2: 8px    --sp-3: 12px   --sp-4: 16px
--sp-5: 20px   --sp-6: 24px   --sp-7: 32px   --sp-8: 40px
```

### Радиус (Border Radius)
```css
--r-sm: 6px    --r-md: 8px    --r-lg: 12px   --r-xl: 16px
--r-pill: 9999px
```

### Сүүдэр (Shadow)
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
--shadow-md: 0 4px 12px rgba(0,0,0,0.12)
--shadow-lift: 0 8px 24px rgba(0,0,0,0.16)
--shadow-glow: 0 0 20px rgba(224,122,62,0.3)
```

## Компонент загварууд

### Карт (Card)
```css
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow .22s ease, transform .22s ease;
}
.card:hover {
  box-shadow: var(--shadow-lift);
  transform: translateY(-3px);
}
```

### Товч (Button)
```css
.btn-primary {
  background: var(--grad-accent); /* #E77A3E gradient */
  color: #fff;
  border-radius: var(--r-md);
  min-height: var(--touch-target); /* 44px */
  font-weight: 600;
}
.btn-ghost {
  background: transparent;
  border: 1.5px solid var(--line);
  color: var(--primary);
}
```

### Badge
```css
.badge {
  font-family: var(--font-mono);
  font-size: 9.5px;
  padding: 4px 9px;
  border-radius: var(--r-pill);
  font-weight: 700;
}
.badge.sitting { background: #2B6575; color: #fff; }
.badge.lost { background: #DC2626; color: #fff; }
.badge.found { background: #16A34A; color: #fff; }
```

### Форм талбар
```css
input, select, textarea {
  padding: 11px 13px;
  border: 1.5px solid var(--line);
  border-radius: var(--r-sm);
  font-size: 14.5px;
  min-height: var(--touch-target);
}
input:focus-visible {
  outline: 2px solid var(--accent);
  border-color: var(--accent);
}
```

## Responsive breakpoint
```css
/* Мобайл */
@media (max-width: 640px) { ... }
@media (max-width: 480px) { ... }

/* Tablet */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 860px) { ... }   /* Preview карт нэмэгдэнэ */
@media (min-width: 1025px) { ... }  /* Навигаци өөрчлөгдөнө */
@media (min-width: 1440px) { ... }  /* Их дэлгэц */
```

## Анимаци
```css
/* Page transition */
@keyframes rise-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hover lift */
.card:hover { transform: translateY(-3px); }

/* Ember glow (hero) */
@keyframes ember-float {
  0% { transform: translate(0,0) scale(0.8); opacity: 0; }
  15% { opacity: 0.9; }
  100% { transform: translate(-20px, -96px) scale(1.15); opacity: 0; }
}
```

## Хэрхэн ашиглах вэ

Шинэ компонент бичихдээ эдгээр token-уудыг заавал ашигла:
- Хатуу утга (`#17414D`) биш CSS variable (`var(--primary)`)
- Зай тэмдэгт (`16px`) биш token (`var(--sp-4)`)
- Радиус тэмдэгт (`8px`) биш token (`var(--r-md)`)

Энэ нь dark mode, theme сэлгэлт, ирээдүйн өөрчлөлтөд тэсвэртэй болгоно.
