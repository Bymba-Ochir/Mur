// lib/assistant/matcher.ts
// Текст normalize, intent matcher, knowledge scorer
import { INTENTS, KNOWLEDGE, SUGGESTED_QUESTIONS } from './knowledge';
import type { KnowledgeEntry, AssistantReply, Severity } from './types';

/** Текстийг цэвэрлэх — lowercase, whitespace, punctuation */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Intent шалгах (мэндчилгээ, баярлалаа) */
export function matchIntent(input: string): AssistantReply | null {
  const normalized = normalizeText(input);
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (normalized.includes(kw)) {
        return {
          text: intent.reply.mn,
          severity: 'info',
          matched: true,
          followUps: SUGGESTED_QUESTIONS.slice(0, 3),
        };
      }
    }
  }
  return null;
}

/** Knowledge base-аас тохирох нэг олох */
export function matchKnowledge(input: string): AssistantReply {
  const normalized = normalizeText(input);
  if (!normalized) {
    return { text: '', severity: 'info', matched: false };
  }

  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        // Урт keyword өндөр оноо
        score += kw.length * entry.weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Оноо хангалтгүй бол
  if (bestScore < normalized.length * 0.3 || !bestEntry) {
    return {
      text: 'Уучлаарай, би энэ асуултанд бүрэн хариулж чадахгүй байна. Дараах сэдвүүдээр асууж үзээрэй: хоол, шинж тэмдэг, вакцин, арчилгаа.',
      severity: 'info',
      matched: false,
      followUps: SUGGESTED_QUESTIONS,
    };
  }

  return {
    text: bestEntry.response.mn,
    severity: bestEntry.severity,
    entryId: bestEntry.id,
    matched: true,
    followUps: bestEntry.followUps,
  };
}

/** Бүх matcher-уудыг нэгтгэх */
export function getAssistantReply(input: string): AssistantReply {
  // 1. Intent шалгах
  const intentMatch = matchIntent(input);
  if (intentMatch) return intentMatch;

  // 2. Knowledge base шалгах
  return matchKnowledge(input);
}

export { SUGGESTED_QUESTIONS };
