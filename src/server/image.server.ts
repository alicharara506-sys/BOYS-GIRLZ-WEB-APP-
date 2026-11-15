import sharp from "sharp";

// Product photos are shown in square frames up to about 800 px wide (1600 px on sharp phone
// screens), so nothing larger is ever needed.
export const MAX_PHOTO_SIDE = 1600;
const QUALITY = 82;

export type CompressedImage = { bytes: Buffer; extension: "webp"; width: number; height: number };

// Makes an uploaded photo web-ready: turned upright from the camera's rotation tag, shrunk so its
// longest side is at most 1600 px (never enlarged), saved as WebP, and stripped of hidden data such
// as the phone's GPS location. Animated GIFs stay animated. The input may be JPG, PNG, WebP or GIF.
export async function compressImage(input: Buffer, { animated = false } = {}): Promise<CompressedImage> {
  const { data, info } = await sharp(input, { animated, failOn: "error" })
    .rotate()
    .resize({ width: MAX_PHOTO_SIDE, height: MAX_PHOTO_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, extension: "webp", width: info.width, height: info.pageHeight ?? info.height };
}
