import sharp from "sharp";

// Product photos are shown in square frames up to about 800 px wide (1600 px on sharp phone
// screens), so nothing larger is ever needed.
export const MAX_PHOTO_SIDE = 1600;
const QUALITY = 82;
// Safety limits, so a small file that unpacks into a gigantic image can't exhaust the server's memory:
// at most 120 megapixels (enough for 108 MP phone cameras) and at most 100 frames for an animated GIF.
export const MAX_INPUT_PIXELS = 120_000_000;
const MAX_FRAMES = 100;
sharp.cache(false);

export type CompressedImage = { bytes: Buffer; extension: "webp"; width: number; height: number };

// Makes an uploaded photo web-ready: turned upright from the camera's rotation tag, shrunk so its
// longest side is at most 1600 px (never enlarged), saved as WebP, and stripped of hidden data such
// as the phone's GPS location. Animated GIFs stay animated. The input may be JPG, PNG, WebP or GIF.
export async function compressImage(input: Buffer, { animated = false } = {}): Promise<CompressedImage> {
  // Asking for more frames than the GIF has is an error, so read its frame count first.
  const pages = animated ? Math.min((await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()).pages || 1, MAX_FRAMES) : 1;
  const { data, info } = await sharp(input, { pages, limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
    .rotate()
    .resize({ width: MAX_PHOTO_SIDE, height: MAX_PHOTO_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, extension: "webp", width: info.width, height: info.pageHeight ?? info.height };
}
