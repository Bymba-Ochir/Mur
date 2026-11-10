export const EMBEDDING_MODEL = 'Xenova/dinov2-small';
export const EMBEDDING_VERSION = 'dinov2-small-q8-v1';
export const EMBEDDING_DIMENSIONS = 384;

// UI scores use cosine similarity on a 0–100 scale.
export const MIN_LISTING_PHOTO_SIMILARITY = 38;
export const HIGH_LISTING_PHOTO_SIMILARITY = 70;

/**
 * DINOv2 output нь [batch, 257 token, 384 feature] хэлбэртэй байдаг.
 * Эхний token нь зургийн global CLS representation тул түүнийг авч L2 normalize хийнэ.
 */
export function poolDinoEmbedding(data: ArrayLike<number>): number[] {
  if (data.length < EMBEDDING_DIMENSIONS || data.length % EMBEDDING_DIMENSIONS !== 0) {
    throw new Error(`DINOv2 embedding хэмжээ буруу: ${data.length}`);
  }
  const cls = Array.from(data).slice(0, EMBEDDING_DIMENSIONS);
  const norm = Math.sqrt(cls.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) throw new Error('DINOv2 embedding normalize хийх боломжгүй');
  return cls.map((value) => value / norm);
}

