import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { compressImage, MAX_PHOTO_SIDE } from "../src/server/image.server.ts";

// A busy photo-like image (random noise compresses poorly, like real fabric texture).
async function photo(width, height, format = "png", options = {}) {
  const noise = Buffer.alloc(width * height * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919 + (i >> 5) * 104729) % 256;
  const image = sharp(noise, { raw: { width, height, channels: 3 } });
  return format === "jpeg" ? image.jpeg({ quality: 95 }).withMetadata(options.metadata || {}).toBuffer() : image.png().toBuffer();
}

test("a large camera photo is shrunk to 1600 px on its longest side and saved as smaller WebP", async () => {
  const input = await photo(4000, 3000, "png");
  const out = await compressImage(input);
  assert.equal(out.extension, "webp");
  assert.equal(Math.max(out.width, out.height), MAX_PHOTO_SIDE);
  assert.equal(out.width, 1600);
  assert.equal(out.height, 1200);
  assert.ok(out.bytes.length < input.length, `expected a smaller file, got ${out.bytes.length} from ${input.length}`);
  assert.equal((await sharp(out.bytes).metadata()).format, "webp");
});

test("a small photo is never enlarged", async () => {
  const out = await compressImage(await photo(600, 600, "png"));
  assert.equal(out.width, 600);
  assert.equal(out.height, 600);
});

test("a sideways phone photo is turned upright and its hidden data is removed", async () => {
  // Stored 3000×2000 with an EXIF tag saying "rotate 90°", as phones do for portrait shots.
  const input = await photo(3000, 2000, "jpeg", { metadata: { orientation: 6, exif: { IFD0: { Copyright: "secret" } } } });
  const out = await compressImage(input);
  assert.equal(out.width, 1067, "portrait after rotation");
  assert.equal(out.height, 1600);
  const meta = await sharp(out.bytes).metadata();
  assert.equal(meta.exif, undefined, "camera data such as location is stripped");
  assert.ok(!meta.orientation || meta.orientation === 1);
});

test("an animated GIF stays animated", async () => {
  // Three 200×200 frames stacked vertically, saved as one animated GIF.
  const frames = Buffer.alloc(200 * 600 * 4);
  for (let i = 0; i < frames.length; i += 4) { frames[i] = (i / 4 / 40000) * 90; frames[i + 1] = 120; frames[i + 2] = 200; frames[i + 3] = 255; }
  const gif = await sharp(frames, { raw: { width: 200, height: 600, channels: 4, pageHeight: 200 } }).gif({ loop: 0 }).toBuffer();
  assert.equal((await sharp(gif, { animated: true }).metadata()).pages, 3);
  const out = await compressImage(gif, { animated: true });
  assert.equal(out.extension, "webp");
  assert.equal((await sharp(out.bytes, { animated: true }).metadata()).pages, 3);
});

test("something that isn't an image is refused", async () => {
  await assert.rejects(compressImage(Buffer.from("not an image")));
});
