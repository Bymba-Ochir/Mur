import { describe, expect, it } from 'vitest';
import { parseAssistantRequest } from '../../lib/assistant/serverInput';

describe('parseAssistantRequest', () => {
  it('keeps only allowlisted assistant fields', () => {
    const result = parseAssistantRequest({
      message: '  Миний нохой юу идэх вэ?  ',
      lang: 'en',
      context: ['browser supplied context must be ignored'],
      petContext: { type: 'Нохой', age: ' 2.56 ', ownerId: 'spoofed-user' },
      userId: 'spoofed-user',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        message: 'Миний нохой юу идэх вэ?',
        locale: 'en',
        petContext: { type: 'Нохой', age: '2.6' },
      },
    });
  });

  it('drops invalid pet context instead of trusting browser values', () => {
    const result = parseAssistantRequest({
      message: 'test',
      lang: 'xx',
      petContext: { type: 'Tiger', age: 9000 },
    });

    expect(result).toEqual({
      ok: true,
      value: { message: 'test', locale: 'mn', petContext: { type: '', age: '' } },
    });
  });

  it('rejects empty and oversized messages', () => {
    expect(parseAssistantRequest({ message: '   ' }).ok).toBe(false);
    expect(parseAssistantRequest({ message: 'x'.repeat(1001) }).ok).toBe(false);
  });
});
