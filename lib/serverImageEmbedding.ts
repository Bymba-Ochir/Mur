import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { env, pipeline, RawImage, type ImageFeatureExtractionPipeline } from '@huggingface/transformers';
import { EMBEDDING_MODEL, poolDinoEmbedding } from './imageEmbedding';

let extractor: Promise<ImageFeatureExtractionPipeline> | null = null;

/** Same q8 model and CLS pooling as browser search, cached only in writable temp storage. */
export async function embedStoredImage(photo: Blob): Promise<number[]> {
  const bytes = Buffer.from(await photo.arrayBuffer());
  const image = sharp(bytes, { limitInputPixels: 16_000_000 });
  const metadata = await image.metadata();
  if (!['jpeg', 'png', 'webp', 'gif'].includes(metadata.format ?? '')) throw new Error('Unsupported stored image');
  const { data, info } = await image.rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  env.allowLocalModels = false;
  env.cacheDir = join(tmpdir(), 'mur-image-models');
  if (!extractor) {
    extractor = pipeline('image-feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8', device: 'cpu',
      session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
    }).catch(error => { extractor = null; throw error; });
  }
  const model = await extractor;
  const output = await model(new RawImage(new Uint8ClampedArray(data), info.width, info.height, info.channels));
  if (!(output.data instanceof Float32Array)) throw new Error('Invalid embedding tensor');
  return poolDinoEmbedding(output.data);
}
