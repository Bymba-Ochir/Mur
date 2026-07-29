'use client';
import { useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';

const AMOUNTS = [3000, 5000, 10000, 20000];

export default function DonateModal({ onClose }) {
  const showToast = useToast();
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [stage, setStage] = useState('form'); // form | loading | qr | paid | error
  const [invoice, setInvoice] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;

  async function handleCreate(e) {
    e.preventDefault();
    if (!finalAmount || finalAmount < 1000) {
      showToast('Хамгийн багадаа 1,000₮', 'error');
      return;
    }
    setStage('loading');
    try {
      const res = await fetch('/api/donations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          supporterName: name || undefined,
          message: message || undefined,
          isAnonymous: anonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Алдаа гарлаа');

      setInvoice(data);
      setStage('qr');

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/donations/status?donationId=${data.donationId}&statusToken=${data.statusToken}`);
          const s = await r.json();
          if (s.status === 'paid') {
            clearInterval(pollRef.current);
            setStage('paid');
          }
        } catch (e) {
          // polling алдааг үл тоомсорлоно
        }
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="donate-title">
        <button className="close" onClick={onClose} aria-label="Хаах">✕</button>
        <h2 id="donate-title">💛 МӨР-ийг дэмжих</h2>

        {stage === 'form' && (
          <form onSubmit={handleCreate}>
            <p className="hint">Таны хандив сервер, домэйн зэрэг зардлыг санхүүжүүлэхэд зарцуулагдана. Баярлалаа! 🙏</p>

            <div className="amounts" role="group" aria-label="Дүн сонгох">
              {AMOUNTS.map((a) => (
                <button
                  type="button" key={a}
                  className={`amount-btn ${amount === a && !customAmount ? 'active' : ''}`}
                  onClick={() => { setAmount(a); setCustomAmount(''); }}
                >
                  {a.toLocaleString()}₮
                </button>
              ))}
            </div>
            <label htmlFor="custom-amount">Өөр дүн</label>
            <input
              id="custom-amount" type="number" min="1000" placeholder="Дурын дүн (₮)"
              value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
            />

            <label htmlFor="donor-name">Нэр (заавал биш)</label>
            <input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Нэрээ бичих" />

            <label htmlFor="donor-message">Мессеж (заавал биш)</label>
            <textarea id="donor-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Урам зориг өгөх үг..." />

            <label className="checkbox-row">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Нэргүйгээр хандивлах
            </label>

            <button type="submit" className="submit-btn">QPay-ээр төлөх</button>
          </form>
        )}

        {stage === 'loading' && <p role="status">⏳ Нэхэмжлэл үүсгэж байна...</p>}

        {stage === 'qr' && invoice && (
          <div className="qr-box">
            <p>{finalAmount.toLocaleString()}₮ дүнтэй нэхэмжлэл үүслээ</p>
            <img src={invoice.qrImage} alt="QPay QR код" className="qr-img" />
            <p className="hint">Банкны апп-аараа QR кодыг уншуулж төлнө үү</p>
            {invoice.deepLinks?.length > 0 && (
              <div className="deep-links">
                {invoice.deepLinks.slice(0, 4).map((l) => (
                  <a key={l.name} href={l.link} className="deep-link">
                    {l.logo && <img src={l.logo} alt="" aria-hidden="true" />}
                    {l.description}
                  </a>
                ))}
              </div>
            )}
            <p className="hint" role="status" aria-live="polite">Төлбөрийг автоматаар шалгаж байна...</p>
          </div>
        )}

        {stage === 'paid' && (
          <div className="paid-box" role="status">
            <div style={{ fontSize: 44 }}>🎉</div>
            <p style={{ fontWeight: 700, color: 'var(--success)' }}>Баярлалаа!</p>
            <p className="hint">Таны {finalAmount.toLocaleString()}₮ хандив амжилттай хийгдлээ.</p>
            <button className="submit-btn" onClick={onClose}>Хаах</button>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <p role="alert" style={{ color: 'var(--alert)' }}>{errorMsg}</p>
            <button className="submit-btn" onClick={() => setStage('form')}>Дахин оролдох</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: var(--overlay); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 16px; }
        .modal { background: var(--card); border-radius: 16px; padding: 24px; max-width: 360px; width: 100%; color: var(--ink); position: relative; max-height: 90vh; overflow-y: auto; }
        .close { position: absolute; top: 14px; right: 14px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--muted); }
        h2 { font-size: 18px; margin-bottom: 12px; }
        .hint { font-size: 12.5px; color: var(--muted); margin-bottom: 12px; }
        .amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .amount-btn { padding: 10px; border-radius: 9px; border: 1.5px solid var(--line); background: var(--bg); color: var(--ink); font-weight: 600; cursor: pointer; }
        .amount-btn.active { background: var(--accent); border-color: var(--accent); color: var(--primary); }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); display: block; margin-top: 10px; margin-bottom: 4px; }
        input, textarea { width: 100%; padding: 9px 11px; border: 1.5px solid var(--line); border-radius: 9px; font-size: 13.5px; background: var(--card); color: var(--ink); font-family: inherit; }
        .checkbox-row { display: flex; align-items: center; gap: 8px; font-weight: 400; color: var(--ink); }
        .checkbox-row input { width: auto; }
        .submit-btn { width: 100%; margin-top: 16px; padding: 12px; border-radius: 10px; border: none; background: var(--brand); color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; }
        .qr-box, .paid-box { text-align: center; }
        .qr-img { width: 200px; height: 200px; margin: 10px auto; border-radius: 10px; border: 1px solid var(--line); }
        .deep-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 10px 0; }
        .deep-link { display: flex; align-items: center; gap: 4px; font-size: 11.5px; background: var(--eyebrow-bg); color: var(--primary); padding: 5px 10px; border-radius: 8px; text-decoration: none; }
        .deep-link img { width: 16px; height: 16px; border-radius: 3px; }
      `}</style>
    </div>
  );
}
