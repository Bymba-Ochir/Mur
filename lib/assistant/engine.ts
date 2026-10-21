// lib/assistant/engine.ts
// AI Зөвлөхийн үндсэн engine — rule engine + optional Groq escalation
import { authenticatedFetch } from '../apiClient';
import { getAssistantReply as ruleEngineReply, retrieveKnowledge, SUGGESTED_QUESTIONS } from './matcher';
import type { AssistantReply, PetAssistantContext } from './types';

export { SUGGESTED_QUESTIONS };

/**
 * Асуултад хариулах — эхлээд rule engine, дараа нь Groq (хэрэв байвал)
 */
export async function getAssistantReply(input: string, lang: 'mn' | 'en' = 'mn', petContext?: PetAssistantContext): Promise<AssistantReply> {
  // 1. Rule engine-ээр шалгах
  const ruleReply = ruleEngineReply(input, lang);
  if (ruleReply.matched) return ruleReply;

  // 2. Confidence-ийг client талын local knowledge-ээр тооцно. Groq-д энэ context-ийг
  // явуулахгүй; server өөрөө ижил message-ээс authoritative context үүсгэнэ.
  const context = retrieveKnowledge(input, 3).map(({ entry }) => entry.response[lang] || entry.response.mn);
  const groqReply = await escalateToGroq(input, lang, petContext);
  if (groqReply) {
    return {
      text: groqReply,
      severity: 'info',
      matched: true,
      followUps: SUGGESTED_QUESTIONS.slice(0, 3),
      confidence: context.length ? 'medium' : 'low',
    };
  }

  // 3. Fallback. Нэвтрээгүй үед authenticatedFetch амжилтгүй болох боловч
  // local rule engine/fallback хэвийн ажиллана.
  return ruleReply;
}

/**
 * Groq API руу илгээх. Auth token-ийг authenticatedFetch server талд verify хийлгэнэ.
 */
async function escalateToGroq(input: string, lang: 'mn' | 'en', petContext?: PetAssistantContext): Promise<string | null> {
  try {
    const res = await authenticatedFetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, lang, petContext }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { text?: string | null };
    return data.text || null;
  } catch {
    return null;
  }
}
