// lib/similarity.ts
//
// DINOv2-small embedding — шууд БРАУЗЕР дотор ажиллана (@huggingface/transformers).
//
// АНХААР: Санг npm-ээр bundle хийвэл Next.js-ийн webpack дотоод ONNX Runtime
// кодыг зөв boldog чадахгүй ("import.meta" алдаа) тул CDN-ээс шууд, webpack-ийг
// тойрч ачаална (transformers.js-ийн албан ёсны зөвлөмжит арга).
//
// Давуу тал: токен, серверийн зардал, rate limit огт хэрэггүй, cross-bundler
// асуудалгүй. Сул тал: эхний ачаалалт (~ хэдэн арван MB загвар) 10-30 секунд
// удаашрах боломжтой, дараа нь browser кэшлэдэг тул хурдан болно.

'use client';

const CDN_URL: string = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
export const EMBEDDING_MODEL = 'Xenova/dinov2-small';
export const EMBEDDING_VERSION = 'dinov2-small-q8-v1';
export const EMBEDDING_DIMENSIONS = 384;

let embedderPromise: Promise<any> | null = null;

async function getEmbedder(onProgress?: (message: string) => void): Promise<any> {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      // webpackIgnore коммент нь Next.js-д энэ модулийг bundle хийхгүй,
      // харин browser дээр шууд CDN-ээс ESM болгон татахыг зааж байна
      const { pipeline, env } = await import(/* webpackIgnore: true */ CDN_URL);
      env.allowLocalModels = false;
      const progress_callback = (p: { status: string; progress?: number }) => {
        if (p.status === 'progress' && onProgress) {
          onProgress(`Загвар татаж байна... ${Math.round(p.progress || 0)}%`);
        }
      };
      const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
      if (hasWebGPU) {
        try {
          onProgress?.('GPU хурдасгуур бэлтгэж байна...');
          return await pipeline('image-feature-extraction', EMBEDDING_MODEL, {
            dtype: 'q8', device: 'webgpu', progress_callback,
          });
        } catch (error) {
          console.warn('WebGPU ажилласангүй, WASM fallback ашиглана:', error);
        }
      }
      onProgress?.('Тохирох AI хөдөлгүүр бэлтгэж байна...');
      return pipeline('image-feature-extraction', EMBEDDING_MODEL, {
        dtype: 'q8', device: 'wasm', progress_callback,
      });
    })();
  }
  return embedderPromise;
}

export async function getImageEmbedding(file: File, onProgress?: (message: string) => void, signal?: AbortSignal): Promise<number[]> {
  if (signal?.aborted) throw new DOMException('AI хайлт цуцлагдлаа', 'AbortError');
  const embedder = await getEmbedder(onProgress);
  if (signal?.aborted) throw new DOMException('AI хайлт цуцлагдлаа', 'AbortError');
  onProgress?.('Зургийг шинжилж байна...');
  const url = URL.createObjectURL(file);
  try {
    const output = await embedder(url, { pooling: 'mean', normalize: true });
    if (signal?.aborted) throw new DOMException('AI хайлт цуцлагдлаа', 'AbortError');
    const embedding = Array.from(output.data) as number[];
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`DINOv2 embedding хэмжээ буруу: ${embedding.length}`);
    }
    return embedding;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Яг ижил файлыг загварын онооноос үл хамааран найдвартай таних SHA-256. */
export async function getImageHash(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Хоёр DINOv2 embedding vector-ийн cosine similarity-г 0-100 оноогоор буцаана
 */
export function cosineSimilarityScore(a: number[] | null | undefined, b: number[] | null | undefined): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  return Math.max(0, Math.min(100, Math.round(cos * 100)));
}

/** SQL hybrid scoring-той ижил жинг client test/preview-д ашиглана. */
export function calculateHybridScore({
  imageSimilarity, sameType = false, sameBreed = false, sameColor = false,
  sameDistrict = false, nearby = false, ageDays = 0,
}: {
  imageSimilarity: number;
  sameType?: boolean;
  sameBreed?: boolean;
  sameColor?: boolean;
  sameDistrict?: boolean;
  nearby?: boolean;
  ageDays?: number;
}): number {
  const image = Math.max(0, Math.min(1, imageSimilarity)) * 70;
  const recency = Math.max(0, 5 - Math.max(0, ageDays) / 30);
  return Math.round((image + (sameType ? 8 : 0) + (sameBreed ? 7 : 0) +
    (sameColor ? 5 : 0) + (sameDistrict ? 3 : 0) + (nearby ? 2 : 0) + recency) * 100) / 100;
}
