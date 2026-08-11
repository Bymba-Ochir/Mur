// lib/assistant/engine.ts
// AI Зөвлөхийн үндсэн engine — rule engine + optional Groq escalation
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

  // 2. Groq API ашиглах (хэрэв GROQ_API_KEY байвал)
  const context = retrieveKnowledge(input, 3).map(({ entry }) => entry.response[lang] || entry.response.mn);
  const groqReply = await escalateToGroq(input, lang, context, petContext);
  if (groqReply) {
    return {
      text: groqReply,
      severity: 'info',
      matched: true,
      followUps: SUGGESTED_QUESTIONS.slice(0, 3),
      confidence: context.length ? 'medium' : 'low',
    };
  }

  // 3. Fallback
  return ruleReply;
}

/**
 * Groq API руу илгээх (сонголттой)
 */
async function escalateToGroq(input: string, lang: 'mn' | 'en', context: string[], petContext?: PetAssistantContext): Promise<string | null> {
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, lang, context, petContext }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}
