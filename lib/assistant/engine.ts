// lib/assistant/engine.ts
// AI Зөвлөхийн үндсэн engine — rule engine + optional Groq escalation
import { getAssistantReply as ruleEngineReply, SUGGESTED_QUESTIONS } from './matcher';
import type { AssistantReply } from './types';

export { SUGGESTED_QUESTIONS };

/**
 * Асуултад хариулах — эхлээд rule engine, дараа нь Groq (хэрэв байвал)
 */
export async function getAssistantReply(input: string, lang: 'mn' | 'en' = 'mn'): Promise<AssistantReply> {
  // 1. Rule engine-ээр шалгах
  const ruleReply = ruleEngineReply(input);
  if (ruleReply.matched) return ruleReply;

  // 2. Groq API ашиглах (хэрэв GROQ_API_KEY байвал)
  const groqReply = await escalateToGroq(input, lang);
  if (groqReply) {
    return {
      text: groqReply,
      severity: 'info',
      matched: true,
      followUps: SUGGESTED_QUESTIONS.slice(0, 3),
    };
  }

  // 3. Fallback
  return ruleReply;
}

/**
 * Groq API руу илгээх (сонголттой)
 */
async function escalateToGroq(input: string, lang: 'mn' | 'en'): Promise<string | null> {
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, lang }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}
