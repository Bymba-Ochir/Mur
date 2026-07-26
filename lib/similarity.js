// lib/similarity.js
//
// Үе шат 2: CLIP embedding — шууд БРАУЗЕР дотор ажиллана (@huggingface/transformers).
//
// АНХААР: Санг npm-ээр bundle хийвэл Next.js-ийн webpack дотоод ONNX Runtime
// кодыг зөв boldog чадахгүй ("import.meta" алдаа) тул CDN-ээс шууд, webpack-ийг
// тойрч ачаална (transformers.js-ийн албан ёсны зөвлөмжит арга).
//
// Давуу тал: токен, серверийн зардал, rate limit огт хэрэггүй, cross-bundler
// асуудалгүй. Сул тал: эхний ачаалалт (~ хэдэн арван MB загвар) 10-30 секунд
// удаашрах боломжтой, дараа нь browser кэшлэдэг тул хурдан болно.

'use client';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

let embedderPromise = null;

async function getEmbedder(onProgress) {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      // webpackIgnore коммент нь Next.js-д энэ модулийг bundle хийхгүй,
      // харин browser дээр шууд CDN-ээс ESM болгон татахыг зааж байна
      const { pipeline, env } = await import(/* webpackIgnore: true */ CDN_URL);
      env.allowLocalModels = false;
      return pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch16', {
        quantized: true,
        progress_callback: (p) => {
          if (p.status === 'progress' && onProgress) {
            onProgress(`Загвар татаж байна... ${Math.round(p.progress || 0)}%`);
          }
        },
      });
    })();
  }
  return embedderPromise;
}

export async function getImageEmbedding(file, onProgress) {
  const embedder = await getEmbedder(onProgress);
  onProgress?.('Зургийг шинжилж байна...');
  const url = URL.createObjectURL(file);
  try {
    const output = await embedder(url, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Хоёр embedding vector-ийн cosine similarity-г 0-100 оноогоор буцаана
 */
export function cosineSimilarityScore(a, b) {
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
