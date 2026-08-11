// app/api/assistant/route.ts
// AI Зөвлөхийн Groq API proxy (сонголттой — GROQ_API_KEY байхгүй бол ажиллахгүй)
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Та МӨР аппын гэрийн амьтны эрүүл мэндийн зөвлөх байна. Монгол хэлээр хариулна уу.

Дүрэм:
- Та малын эмч биш — онош тавихгүй, зөвхөн ерөнхий зөвлөгөө өгнө
- Хүнд шинж тэмдэг, яаралтай үед малын эмчид хандахыг зөвлө
- Хортой хоол, халдвар, шинж тэмдэгийн талаар мэдээлэл өгнө
- Өгөгдсөн МЭДЛЭГИЙН ХЭСЭГ-т тулгуурла. Хангалтгүй бол тодорхойгүй гэдгээ хэл
- Эмийн нэр, тун, оношийг зохиож болохгүй
- Яаралтай шинж тэмдэг байвал хамгийн түрүүнд эмнэлэгт хандахыг зөвлө
- Хариултын төгсгөлд '⚠️ Энэ зөвлөгөө нь малын эмчийг орлохгүй.' гэж нэмнэ
- Товч, ойлгомжтой хариулна уу (500 тэмдэгтээс бага)`;

export async function POST(request: Request) {
  try {
    const { message, lang, context, petContext } = await request.json();

    // Валидаци
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Мессеж шаардлагатай' }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Мессеж хэт урт байна (1000 тэмдэгтээс бага)' }, { status: 400 });
    }

    // GROQ_API_KEY шалгах
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: null });
    }

    // Groq API руу хүсэлт
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Амьтны мэдээлэл: ${JSON.stringify(petContext || {})}\nМЭДЛЭГИЙН ХЭСЭГ:\n${Array.isArray(context) ? context.slice(0, 3).join('\n---\n') : 'Олдсонгүй'}\n\nАСУУЛТ: ${message}` },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error('Groq API алдаа:', response.status);
      return NextResponse.json({ text: null });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || null;

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Assistant API алдаа:', err);
    return NextResponse.json({ text: null });
  }
}
