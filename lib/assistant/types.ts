// lib/assistant/types.ts
// AI Зөвлөхийн төрлүүд

export type Severity = 'info' | 'caution' | 'emergency';

export interface AssistantSource {
  label: string;
  url: string;
}

export interface PetAssistantContext {
  type?: 'Нохой' | 'Муур' | '';
  age?: string;
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  weight: number;
  severity: Severity;
  response: { mn: string; en?: string };
  followUps?: string[];
  related?: string[];
}

export interface IntentRule {
  id: string;
  keywords: string[];
  reply: { mn: string; en?: string };
}

export interface AssistantReply {
  text: string;
  severity: Severity;
  entryId?: string;
  matched: boolean;
  followUps?: string[];
  sources?: AssistantSource[];
  confidence?: 'high' | 'medium' | 'low';
}
