// lib/contentModeration.js
//
// Оруулсан зураг нохой/муур бус, эсвэл зохисгүй агуулгатай эсэхийг шалгах.
// Аль хэдийн ажиллаж байгаа CLIP CDN ачаалалтын аргыг (similarity.js) дахин
// ашигласан тул шинэ, тогтворгүй сан (жишээ нь nsfwjs+tfjs) нэмэлгүйгээр,
// найдвартай ажиллана.

'use client';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
const LABELS = [
  'a photo of a dog or a cat',
  'an explicit or inappropriate photo',
  'a screenshot, document, or unrelated random photo',
];

let classifierPromise = null;

async function getClassifier(onProgress) {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { pipeline, env } = await import(/* webpackIgnore: true */ CDN_URL);
      env.allowLocalModels = false;
      return pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch16', {
        quantized: true,
        progress_callback: (p) => {
          if (p.status === 'progress' && onProgress) {
            onProgress(`Зургийг шалгаж байна... ${Math.round(p.progress || 0)}%`);
          }
        },
      });
    })();
  }
  return classifierPromise;
}

/**
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function checkImageContent(file, onProgress) {
  try {
    const classifier = await getClassifier(onProgress);
    onProgress?.('Зургийг шалгаж байна...');
    const url = URL.createObjectURL(file);
    let result;
    try {
      result = await classifier(url, LABELS);
    } finally {
      URL.revokeObjectURL(url);
    }

    const top = result[0];
    if (top.label === LABELS[1] && top.score > 0.45) {
      return { ok: false, reason: 'Зохисгүй агуулгатай байж болзошгүй тул хориглогдлоо.' };
    }
    if (top.label === LABELS[0] && top.score < 0.25) {
      // Нохой/муур гэдэгт хамгийн бага итгэлтэй байгаа ч бүрэн хориглохгүй,
      // зөвхөн анхааруулга — гар зураг муу чанартай байж болзошгүй тул
      return { ok: true, warning: 'Зураг дээр нохой/муур тод харагдахгүй байж магадгүй. Шалгаад үргэлжлүүлээрэй.' };
    }
    return { ok: true };
  } catch (err) {
    // Загвар ачаалахад алдаа гарвал шүүлтийг алгасаад үргэлжлүүлэх боломж олгоно
    // (хэрэглэгчийг блоклохгүй, зөвхөн нэмэлт давхарга тул)
    console.warn('Content moderation алдаа:', err.message);
    return { ok: true };
  }
}
