export const COVER_SAMPLE_SIZE = 32;

/** Average luminance over an 8×8 grid, independent of file encoding. */
export function coverPhotoFingerprint(pixels: ArrayLike<number>, channels: 3 | 4): string {
  const grid = new Float64Array(64);
  const tile = COVER_SAMPLE_SIZE / 8;
  for (let y = 0; y < COVER_SAMPLE_SIZE; y += 1) {
    for (let x = 0; x < COVER_SAMPLE_SIZE; x += 1) {
      const offset = (y * COVER_SAMPLE_SIZE + x) * channels;
      const cell = Math.floor(y / tile) * 8 + Math.floor(x / tile);
      grid[cell] += 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
    }
  }
  const average = grid.reduce((sum, value) => sum + value, 0) / grid.length;
  return Array.from(grid, value => value >= average ? '1' : '0').join('');
}
