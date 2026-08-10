'use client';
import { useState } from 'react';
import { useLocalStorageValue, setLocalStorageValue } from '../lib/useLocalStorageState';

const SEEN_KEY = 'mur-onboarding-seen';

interface Slide {
  icon: string;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🐾',
    title: 'Тавтай морил МӨР-т',
    text: 'Алдсан, олдсон нохой муурыг хурдан олоход туслах платформ.',
  },
  {
    icon: '📸',
    title: 'Зураг оруулаад мэдэгдээрэй',
    text: 'Алдсан эсвэл олсон амьтныхаа зургийг оруулаад, дүүрэг сонгоод нийтэлнэ.',
  },
  {
    icon: '🔍',
    title: 'AI-аар төстэй амьтныг олоорой',
    text: 'Жагсаалт хэсэгт зургаа оруулбал хамгийн төстэй бичлэгүүдийг эрэмбэлж өгнө.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  // localStorage-тэй синхрончлогдсон "харсан" туг — useSyncExternalStore
  // (server дээр '1' → анхны анивчилтгүй; анх удаагийн хэрэглэгчид mount-ын
  // дараа харагдана)
  const seen = useLocalStorageValue(SEEN_KEY, '1');
  const visible = seen !== '1';

  function close() {
    setLocalStorageValue(SEEN_KEY, '1');
  }

  function next() {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else close();
  }

  if (!visible) return null;
  const slide = SLIDES[step];

  return (
    <div className="onb-overlay" onClick={close}>
      <div className="onb-card" onClick={(e) => e.stopPropagation()}>
        <button className="onb-skip" onClick={close}>Алгасах</button>
        <div className="onb-icon">{slide.icon}</div>
        <h2>{slide.title}</h2>
        <p>{slide.text}</p>
        <div className="onb-dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={`onb-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
        <button className="onb-next" onClick={next}>
          {step === SLIDES.length - 1 ? 'Эхлэх' : 'Дараах'}
        </button>
      </div>

      <style jsx>{`
        .onb-overlay {
          position: fixed; inset: 0; background: var(--overlay);
          display: flex; align-items: center; justify-content: center; z-index: 400; padding: 20px;
        }
        .onb-card {
          background: var(--card); border-radius: var(--r-lg); padding: 32px 28px; box-shadow: var(--shadow-lift); max-width: 340px; width: 100%;
          text-align: center; position: relative; animation: pop 0.2s ease-out;
        }
        @keyframes pop { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .onb-skip {
          position: absolute; top: 14px; right: 16px; background: none; border: none;
          color: var(--muted); font-size: 12.5px; cursor: pointer;
        }
        .onb-icon { font-size: 52px; margin-bottom: 14px; }
        h2 { font-size: 19px; color: var(--primary); margin-bottom: 8px; font-family: inherit; }
        p { font-size: 13.5px; color: var(--muted); margin-bottom: 20px; line-height: 1.5; }
        .onb-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; }
        .onb-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--line); transition: all 0.2s; }
        .onb-dot.active { background: var(--accent); width: 20px; border-radius: 4px; }
        .onb-next {
          width: 100%; padding: 12px; border-radius: var(--r-md); border: none;
          background: var(--grad-brand); color: var(--text-on-accent); font-weight: 600; cursor: pointer; font-size: 14px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .onb-next:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); filter: saturate(1.08); }
        .onb-next:focus-visible { outline: 2.5px solid var(--border-focus); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
