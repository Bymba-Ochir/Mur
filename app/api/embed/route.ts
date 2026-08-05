// app/api/embed/route.ts
//
// Зурган CLIP embedding гаргах серверийн route. HUGGINGFACE_API_TOKEN-г
// зөвхөн серверийн орчинд (.env.local, NEXT_PUBLIC угтваргүй) хадгална,
// ингэснээр browser-т нууц түлхүүр цацагдахгүй.
import { NextResponse } from 'next/server';

const MODEL = 'sentence-transformers/clip-ViT-B-32';
// Hugging Face 2025 оны сүүлээс api-inference.huggingface.co-г идэвхгүй болгож,
// router.huggingface.co руу шилжсэн (хуучин хаяг 410 буцаадаг болсон).
const HF_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

export async function POST(request: Request) {
  try {
    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_TOKEN тохируулагдаагүй байна. .env.local / Vercel env variable шалгана уу.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Зураг ирсэнгүй.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // HF үнэгүй Inference API заримдаа "cold start" (503, model loading) буцаадаг тул
    // 2 удаа дахин оролдоно.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(HF_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer,
      });

      if (res.status === 503) {
        const info = await res.json().catch(() => ({}));
        await new Promise((r) => setTimeout(r, (info.estimated_time || 5) * 1000));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Hugging Face алдаа (${res.status}): ${errText}` },
          { status: 502 }
        );
      }

      const embedding = await res.json();
      // Загвараас хамааран [vector] эсвэл vector хэлбэрээр ирж болно — тэгш байдалд оруулна
      const flat = Array.isArray(embedding[0]) ? embedding[0] : embedding;
      return NextResponse.json({ embedding: flat });
    }

    return NextResponse.json(
      { error: 'Загвар ачаалж дуусаагүй байна. Дахин оролдоно уу (эхний удаа 10-20 секунд удааширдаг).' },
      { status: 503 }
    );
  } catch (err) {
    console.error('Embed route алдаа:', err);
    return NextResponse.json(
      { error: `Серверийн алдаа: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
