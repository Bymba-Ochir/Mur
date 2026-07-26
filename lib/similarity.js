// lib/similarity.js
//
// Үе шат 2: CLIP embedding (Hugging Face Inference API, /api/embed route-оор дамжина)
// Зурган өнгөний histogram-ыг CLIP vector-оор сольсон — семантик төстэй байдал
// (эмжлэг, хэлбэр, зан төрх) илүү нарийвчлалтай тодорхойлно.

export async function getImageEmbedding(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/embed', { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Embedding гаргахад алдаа гарлаа');
  }
  return data.embedding; // тоон vector, ж: 512 хэмжээст
}

/**
 * Хоёр embedding vector-ийн cosine similarity-г 0-100 оноогоор буцаана
 */
export function cosineSimilarityScore(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  // CLIP embeddings ихэвчлэн 0.2-1.0 хооронд байдаг тул харагдах байдлыг тохируулна
  return Math.max(0, Math.min(100, Math.round(cos * 100)));
}
