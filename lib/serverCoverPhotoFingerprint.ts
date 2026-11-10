import sharp from 'sharp';
import { COVER_SAMPLE_SIZE, coverPhotoFingerprint } from './coverPhotoFingerprint';

export async function fingerprintStoredCover(photo: Blob): Promise<string> {
  const image = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 16_000_000 });
  const metadata = await image.metadata();
  if (!['jpeg', 'png', 'webp', 'gif'].includes(metadata.format ?? '')) throw new Error('Unsupported stored image');
  const data = await image.rotate()
    .flatten({ background: '#000' })
    .resize(COVER_SAMPLE_SIZE, COVER_SAMPLE_SIZE, { fit: 'fill' })
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer();
  return coverPhotoFingerprint(data, 3);
}
