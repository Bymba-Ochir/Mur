// app/api/assistant/route.ts
// AI Зөвлөхийн Groq API proxy (сонголттой — GROQ_API_KEY байхгүй бол ажиллахгүй)
import { NextResponse } from 'next/server';

const SYSTEM_PROMPTS = {
  mn: `Та МӨР аппын гэрийн амьтны эрүүл мэндийн зөвлөх байна. Монгол хэлээр хариулна уу.

Дүрэм:
- Та малын эмч биш — онош тавихгүй, зөвхөн ерөнхий зөвлөгөө өгнө
- Хүнд шинж тэмдэг, яаралтай үед малын эмчид хандахыг зөвлө
- Хортой хоол, халдвар, шинж тэмдэгийн талаар мэдээлэл өгнө
- Өгөгдсөн МЭДЛЭГИЙН ХЭСЭГ-т тулгуурла. Хангалтгүй бол тодорхойгүй гэдгээ хэл
- Эмийн нэр, тун, оношийг зохиож болохгүй
- Яаралтай шинж тэмдэг байвал хамгийн түрүүнд эмнэлэгт хандахыг зөвлө
- Хариултын төгсгөлд 'Энэ зөвлөгөө нь малын эмчийг орлохгүй.' гэж нэмнэ
- Товч, ойлгомжтой хариулна уу (500 тэмдэгтээс бага)`,
  en: `You are the pet health assistant in the MӨР app. Reply in English.

Rules:
- You are not a veterinarian. Do not diagnose; provide general guidance only.
- Recommend contacting a veterinarian for severe or urgent symptoms.
- Use the supplied KNOWLEDGE CONTEXT. Say when the information is insufficient.
- Never invent medication names, dosages, or diagnoses.
- Put urgent veterinary care first when emergency signs are described.
- End with 'This guidance does not replace a veterinarian.'
- Keep the response clear and under 500 characters.`,
} as const;

export async function POST(request: Request) {
  try {
    const { message, lang, context, petContext } = await request.json();
    const locale = lang === 'en' ? 'en' : 'mn';

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
          { role: 'system', content: SYSTEM_PROMPTS[locale] },
          { role: 'user', content: `${locale === 'mn' ? 'Амьтны мэдээлэл' : 'Pet context'}: ${JSON.stringify(petContext || {})}\n${locale === 'mn' ? 'МЭДЛЭГИЙН ХЭСЭГ' : 'KNOWLEDGE CONTEXT'}:\n${Array.isArray(context) ? context.slice(0, 3).join('\n---\n') : locale === 'mn' ? 'Олдсонгүй' : 'None found'}\n\n${locale === 'mn' ? 'АСУУЛТ' : 'QUESTION'}: ${message}` },
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
