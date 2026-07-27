import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="eyebrow">🐾 Улаанбаатараас эхэлж байна</div>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Алдсан амьтан гэрээ олж чадна
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 480, marginBottom: 24 }}>
        Зураг оруулаад, ойр орчмынхонтой шууд холбогдоорой. Нэг платформ дээр
        мэдэгдэж, хайж, тохируулна.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/report-lost" className="btn btn-accent">🐾 Алдсан мэдэгдэх</Link>
        <Link href="/report-found" className="btn btn-primary">👀 Олсон зурагтай</Link>
      </div>

      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Яаж ажилладаг вэ</h2>
        <div className="grid">
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>1. Бүртгэх</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>
              Зураг, өнгө, газраа оруулна.
            </p>
          </div>
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>2. Харах</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>
              Дүүргээр шүүж, жагсаалт үзнэ.
            </p>
          </div>
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>3. Холбогдох</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>
              Утсаар шууд холбогдоно.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
