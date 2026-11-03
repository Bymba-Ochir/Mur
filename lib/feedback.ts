export const FEEDBACK_CATEGORIES = ['suggestion', 'bug', 'other'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_MIN_LENGTH = 10;
export const FEEDBACK_MAX_LENGTH = 2000;
export const FEEDBACK_PAGE_PATTERN = /^\/(?:[a-z0-9-]{1,48})?$/;

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return FEEDBACK_CATEGORIES.some((category) => category === value);
}

export function feedbackPage(pathname: string): string {
  const area = '/' + (pathname.split('/')[1] ?? '');
  return FEEDBACK_PAGE_PATTERN.test(area) ? area : '/';
}
