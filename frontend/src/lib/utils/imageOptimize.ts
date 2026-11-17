/**
 * Shrinks and re-encodes an image in the browser before it is uploaded.
 *
 * - Resized so the longest side fits the preset (never enlarged).
 * - Saved as WebP. Browsers that can't encode WebP (Safari) get JPEG, or
 *   PNG when the image has transparency (e.g. a logo).
 * - Re-encoding drops hidden metadata (camera details, GPS location), and
 *   the photo is turned upright using its EXIF orientation first.
 *
 * Anything that is not a JPEG/PNG/WebP image (e.g. a PDF) is returned as is.
 * If anything goes wrong the original file is returned, so an upload never
 * fails because of this step; the normal size and type checks still apply.
 */

export type ImagePreset = "photo" | "logo" | "avatar";

const PRESETS: Record<ImagePreset, { maxSide: number; quality: number }> = {
  // Listing photos and cover images: sharp on large screens, ~300-600 KB.
  photo: { maxSide: 2048, quality: 0.82 },
  // Logos are shown small; keep edges crisp.
  logo: { maxSide: 800, quality: 0.9 },
  // Profile photos.
  avatar: { maxSide: 800, quality: 0.85 },
};

const OPTIMIZABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Original photos up to this size are accepted; they are made smaller before upload. */
export const MAX_ORIGINAL_IMAGE_BYTES = 25 * 1024 * 1024;

// iOS Safari refuses canvases larger than ~16.7 million pixels.
const MAX_CANVAS_PIXELS = 16_000_000;

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export const isOptimizableImage = (file: File) => OPTIMIZABLE_TYPES.includes(file.type);

const makeCanvas = (width: number, height: number): Canvas => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const context2d = (canvas: Canvas, alpha: boolean): Context2D => {
  const ctx = canvas.getContext("2d", { alpha }) as Context2D | null;
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
};

const releaseCanvas = (canvas: Canvas) => {
  // Frees the pixel memory straight away (matters on phones).
  canvas.width = 0;
  canvas.height = 0;
};

const encode = async (canvas: Canvas, type: string, quality: number): Promise<Blob | null> => {
  if ("convertToBlob" in canvas) {
    try {
      return await canvas.convertToBlob({ type, quality });
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
};

/** Decodes the file, turned upright according to its EXIF orientation. */
const decode = async (file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
};

/**
 * Draws the image at the target size. Large reductions are done in halving
 * steps, which keeps fine detail (a single big jump looks jagged).
 */
const resize = (
  image: { source: CanvasImageSource; width: number; height: number },
  targetWidth: number,
  targetHeight: number,
  alpha: boolean,
): Canvas => {
  let source: CanvasImageSource = image.source;
  let width = image.width;
  let height = image.height;
  let previous: Canvas | null = null;

  while (width !== targetWidth || height !== targetHeight) {
    let nextWidth = Math.max(targetWidth, Math.round(width / 2));
    let nextHeight = Math.max(targetHeight, Math.round(height / 2));
    if (nextWidth * nextHeight > MAX_CANVAS_PIXELS) {
      const shrink = Math.sqrt(MAX_CANVAS_PIXELS / (nextWidth * nextHeight));
      nextWidth = Math.max(targetWidth, Math.floor(nextWidth * shrink));
      nextHeight = Math.max(targetHeight, Math.floor(nextHeight * shrink));
    }

    const canvas = makeCanvas(nextWidth, nextHeight);
    const ctx = context2d(canvas, alpha);
    if (!alpha) {
      // JPEG has no transparency: a white background instead of black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, nextWidth, nextHeight);
    }
    ctx.drawImage(source, 0, 0, nextWidth, nextHeight);
    if (previous) releaseCanvas(previous);

    previous = canvas;
    source = canvas;
    width = nextWidth;
    height = nextHeight;
  }

  if (previous) return previous;
  // Already the right size: copy it onto a canvas to re-encode.
  const canvas = makeCanvas(width, height);
  const ctx = context2d(canvas, alpha);
  if (!alpha) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
};

/** True when any pixel is not fully opaque. */
const hasTransparency = (canvas: Canvas) => {
  const ctx = canvas.getContext("2d") as Context2D | null;
  if (!ctx) return false;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 255) return true;
  }
  return false;
};

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const renamed = (name: string, type: string) =>
  `${name.replace(/\.[^./\\]+$/, "") || "image"}.${EXTENSIONS[type] ?? "img"}`;

export const optimizeImage = async (file: File, preset: ImagePreset = "photo"): Promise<File> => {
  if (typeof window === "undefined" || !isOptimizableImage(file)) return file;

  const { maxSide, quality } = PRESETS[preset];
  let decoded: Awaited<ReturnType<typeof decode>> | null = null;
  let canvas: Canvas | null = null;

  try {
    decoded = await decode(file);
    const { width, height } = decoded;
    if (!width || !height) return file;

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    // JPEG sources can't be transparent; PNG/WebP may be (logos).
    const mayHaveAlpha = file.type !== "image/jpeg";
    canvas = resize(decoded, targetWidth, targetHeight, mayHaveAlpha);
    decoded.close();
    decoded = null;

    let blob = await encode(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      // This browser can't make WebP (Safari): PNG to keep transparency, else JPEG.
      if (mayHaveAlpha && hasTransparency(canvas)) {
        blob = await encode(canvas, "image/png", 1);
      } else if (mayHaveAlpha) {
        // Put it on white first: JPEG would turn see-through areas black.
        const flat = resize({ source: canvas, width: targetWidth, height: targetHeight }, targetWidth, targetHeight, false);
        try {
          blob = await encode(flat, "image/jpeg", quality);
        } finally {
          releaseCanvas(flat);
        }
      } else {
        blob = await encode(canvas, "image/jpeg", quality);
      }
    }
    if (!blob || !blob.size) return file;

    // An already small, already sized image can come out bigger; keep the original then.
    if (scale === 1 && blob.size >= file.size) return file;

    return new File([blob], renamed(file.name, blob.type), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn(`Could not optimise "${file.name}", uploading the original.`, error);
    return file;
  } finally {
    decoded?.close();
    if (canvas) releaseCanvas(canvas);
  }
};
