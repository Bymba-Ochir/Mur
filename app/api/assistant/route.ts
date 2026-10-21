// app/api/assistant/route.ts
// AI Зөвлөхийн Groq API proxy. Browser payload-ийг authoritative гэж үзэхгүй:
// auth-ийг server талд verify хийж, knowledge context-ийг server талд дахин үүсгэнэ.
import { NextResponse } from 'next/server';
import { retrieveKnowledge } from '../../../lib/assistant/matcher';
import { parseAssistantRequest } from '../../../lib/assistant/serverInput';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { requireRequestUser } from '../../../lib/serverAuth';

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
    const parsed = parseAssistantRequest(await request.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    let userId: string;
    try {
      const { user } = await requireRequestUser(request);
      userId = user.id;
    } catch {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 });
    }

    // Нэг account + нэг IP дээр тусдаа хязгаар тавина. Энэ нь distributed hard limit биш
    // боловч serverless instance дээрх abuse/spam-ыг бууруулна.
    const userLimit = checkRateLimit(`assistant:user:${userId}`, 30, 10 * 60_000);
    const ipLimit = checkRateLimit(`assistant:ip:${getClientIp(request)}`, 60, 10 * 60_000);
    if (!userLimit.allowed || !ipLimit.allowed) {
      const retryAfterSec = Math.max(userLimit.retryAfterSec, ipLimit.retryAfterSec);
      return NextResponse.json(
        { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ text: null });

    const { message, locale, petContext } = parsed.value;

    // Browser-ийн context[]-д итгэхгүй. Мэдлэгийн хэсгийг server өөрөө message-ээс үүсгэнэ.
    const knowledgeContext = retrieveKnowledge(message, 3)
      .map(({ entry }) => entry.response[locale] || entry.response.mn)
      .filter(Boolean);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[locale] },
          {
            role: 'user',
            content: `${locale === 'mn' ? 'Амьтны мэдээлэл' : 'Pet context'}: ${JSON.stringify(petContext)}\n${locale === 'mn' ? 'МЭДЛЭГИЙН ХЭСЭГ' : 'KNOWLEDGE CONTEXT'}:\n${knowledgeContext.length ? knowledgeContext.join('\n---\n') : locale === 'mn' ? 'Олдсонгүй' : 'None found'}\n\n${locale === 'mn' ? 'АСУУЛТ' : 'QUESTION'}: ${message}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error('Groq API алдаа:', response.status);
      return NextResponse.json({ text: null });
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content || null;

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Assistant API алдаа:', err);
    return NextResponse.json({ text: null }, { status: 500 });
  }
}
