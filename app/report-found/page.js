'use client';
import PetForm from '../../components/PetForm';

export default function ReportFoundPage() {
  return (
    <div>
      <div className="eyebrow">👀 Олсон амьтан</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Олдсон мэдээллээ оруулна уу</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
        Таны оруулсан мэдээлэл эзнийг нь олоход шууд тусална.
      </p>
      <PetForm status="found" />
    </div>
  );
}
