'use client';
import PetForm from '../../components/PetForm';

export default function ReportLostPage() {
  return (
    <div>
      <div className="eyebrow">🚨 Алдсан амьтан</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Мэдээллээ оруулна уу</h1>
      <p style={{ color: '#6B7680', marginBottom: 20 }}>
        Зураг оруулах тусам ижил төстэй олдсон бичлэгийг олох магадлал өснө.
      </p>
      <PetForm status="lost" />
    </div>
  );
}
