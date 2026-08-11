import { describe, expect, it } from 'vitest';
import { getAssistantReply, retrieveKnowledge } from '../../lib/assistant/matcher';

describe('assistant retrieval', () => {
  it('хамааралтай мэдлэгийг оноогоор эрэмбэлнэ', () => {
    const matches = retrieveKnowledge('нохой шоколад идсэн', 3);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].entry.category).toBe('emergency');
  });

  it('локал мэдлэгийн хариултад source ба confidence нэмнэ', () => {
    const reply = getAssistantReply('муур вакцин хийлгэх хугацаа');
    expect(reply.matched).toBe(true);
    expect(reply.sources?.length).toBeGreaterThan(0);
    expect(reply.confidence).not.toBe('low');
  });

  it('англи хариултыг сонгож чадна', () => {
    const reply = getAssistantReply('my cat is itching', 'en');
    expect(reply.matched).toBe(true);
    expect(reply.text).toMatch(/itch|flea|tick|allerg/i);
  });
});
