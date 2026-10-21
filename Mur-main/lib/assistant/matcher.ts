// lib/assistant/matcher.ts
// Текст normalize, intent matcher, knowledge scorer
import { INTENTS, KNOWLEDGE, SUGGESTED_QUESTIONS } from './knowledge';
import type { KnowledgeEntry, AssistantReply, Severity } from './types';

const CATEGORY_SOURCES: Record<string, { label: string; url: string }[]> = {
  vaccine: [{ label: 'WSAVA — Vaccination Guidelines', url: 'https://wsava.org/global-guidelines/vaccination-guidelines/' }],
  food: [{ label: 'ASPCA — Animal Poison Control', url: 'https://www.aspca.org/pet-care/animal-poison-control' }],
  emergency: [{ label: 'Cornell University — Pet Emergency', url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/health-info/when-go-emergency-room' }],
  parasite: [{ label: 'CAPC — Parasite Guidelines', url: 'https://capcvet.org/guidelines/' }],
  symptom: [{ label: 'Merck Veterinary Manual — Pet Health', url: 'https://www.merckvetmanual.com/pethealth' }],
  care: [{ label: 'WSAVA — Global Guidelines', url: 'https://wsava.org/global-guidelines/' }],
  firstaid: [{ label: 'American Red Cross — Pet First Aid', url: 'https://www.redcross.org/take-a-class/first-aid/cat-dog-first-aid' }],
};

const ENGLISH_ALIASES: Record<string, string> = {
  itching: 'загатнах', itchy: 'загатнах', vomiting: 'бөөлжих', vomit: 'бөөлжих',
  diarrhea: 'суулгалт', vaccine: 'вакцин', vaccination: 'вакцин', fever: 'халуурах',
  limping: 'доголох', fleas: 'бөөс', ticks: 'хачиг', worms: 'хорхой',
  chocolate: 'шоколад', poison: 'хордлого', appetite: 'хоолны дуршилгүй',
};

function expandEnglishAliases(normalized: string): string {
  const additions = Object.entries(ENGLISH_ALIASES)
    .filter(([english]) => normalized.split(' ').includes(english))
    .map(([, mongolian]) => mongolian);
  return additions.length ? `${normalized} ${additions.join(' ')}` : normalized;
}

/** Текстийг цэвэрлэх — lowercase, whitespace, punctuation */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Intent шалгах (мэндчилгээ, баярлалаа) */
export function matchIntent(input: string, lang: 'mn' | 'en' = 'mn'): AssistantReply | null {
  const normalized = normalizeText(input);
  const tokens = new Set(normalized.split(' '));
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      const normalizedKeyword = normalizeText(kw);
      const matches = normalizedKeyword.length <= 3
        ? tokens.has(normalizedKeyword)
        : normalized.includes(normalizedKeyword);
      if (matches) {
        return {
          text: lang === 'en' ? intent.reply.en || intent.reply.mn : intent.reply.mn,
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
export function retrieveKnowledge(input: string, limit = 3): { entry: KnowledgeEntry; score: number }[] {
  const normalized = expandEnglishAliases(normalizeText(input));
  if (!normalized) return [];
  return KNOWLEDGE.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        // Урт keyword өндөр оноо
        score += kw.length * entry.weight;
      }
    }
    return { entry, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

export function matchKnowledge(input: string, lang: 'mn' | 'en' = 'mn'): AssistantReply {
  const normalized = normalizeText(input);
  if (!normalized) return { text: '', severity: 'info', matched: false, confidence: 'low' };
  const [best] = retrieveKnowledge(input, 1);
  const bestEntry = best?.entry ?? null;
  const bestScore = best?.score ?? 0;

  // Оноо хангалтгүй бол
  if (bestScore < normalized.length * 0.3 || !bestEntry) {
    return {
      text: 'Уучлаарай, би энэ асуултанд бүрэн хариулж чадахгүй байна. Дараах сэдвүүдээр асууж үзээрэй: хоол, шинж тэмдэг, вакцин, арчилгаа.',
      severity: 'info',
      matched: false,
      followUps: SUGGESTED_QUESTIONS,
      confidence: 'low',
    };
  }

  return {
    text: lang === 'en' ? bestEntry.response.en || bestEntry.response.mn : bestEntry.response.mn,
    severity: bestEntry.severity,
    entryId: bestEntry.id,
    matched: true,
    followUps: bestEntry.followUps,
    sources: CATEGORY_SOURCES[bestEntry.category] || CATEGORY_SOURCES.care,
    confidence: bestScore >= normalized.length ? 'high' : 'medium',
  };
}

/** Бүх matcher-уудыг нэгтгэх */
export function getAssistantReply(input: string, lang: 'mn' | 'en' = 'mn'): AssistantReply {
  // 1. Intent шалгах
  const intentMatch = matchIntent(input, lang);
  if (intentMatch) return intentMatch;

  // 2. Knowledge base шалгах
  return matchKnowledge(input, lang);
}

export { SUGGESTED_QUESTIONS };
