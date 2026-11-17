"use client";
"use no memo";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowLeft, ArrowRight, ImagePlus, Star, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  LISTING_PHOTO_TYPES,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_PHOTO_BYTES,
  MIN_LISTING_PHOTOS,
  type ListingPhoto,
} from "@/lib/schemas/listingBase";

const ACCEPT = LISTING_PHOTO_TYPES.join(",");
let nextId = 0;
const newId = () => `new-${Date.now().toString(36)}-${nextId++}`;

/**
 * The listing's photos, in display order. The first photo is the cover and
 * has its own box; it can be replaced but never left empty. The rest sit in a
 * gallery below that can be reordered by dragging (or the arrow buttons on
 * touch screens). Several photos can be added at once, by picking or dropping.
 */
export default function ListingPhotosField({ name = "photos" }: { name?: string }) {
  const { watch, setValue, getValues, formState } = useFormContext();
  const photos: ListingPhoto[] = watch(name) ?? [];
  const error = (formState.errors as any)?.[name]?.message as string | undefined;

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const objectUrls = useRef(new Set<string>());

  // Free local previews when the form goes away.
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  // Always start from the form's latest photos, so quick actions never undo each other.
  const current = (): ListingPhoto[] => getValues(name) ?? [];

  const update = (next: ListingPhoto[]) =>
    // Checked again only after a save attempt; the counter shows what is missing meanwhile.
    setValue(name, next, { shouldValidate: formState.isSubmitted, shouldDirty: true });

  const release = (photo: ListingPhoto) => {
    if (photo.file && objectUrls.current.has(photo.preview)) {
      URL.revokeObjectURL(photo.preview);
      objectUrls.current.delete(photo.preview);
    }
  };

  /** Adds picked or dropped files at `insertAt` (default: the end). */
  const addFiles = (fileList: FileList | File[] | null, insertAt?: number) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const photos = current();

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!LISTING_PHOTO_TYPES.includes(file.type)) rejected.push(`"${file.name}" is not a JPG, PNG or WebP image`);
      else if (file.size > MAX_LISTING_PHOTO_BYTES) rejected.push(`"${file.name}" is larger than 25 MB`);
      else accepted.push(file);
    }

    const room = MAX_LISTING_PHOTOS - photos.length;
    if (accepted.length > room) {
      rejected.push(
        room > 0
          ? `Only ${room} more photo${room === 1 ? "" : "s"} could be added (${MAX_LISTING_PHOTOS} maximum)`
          : `This listing already has the maximum of ${MAX_LISTING_PHOTOS} photos`,
      );
      accepted.splice(room);
    }
    if (rejected.length) toast.error(rejected.slice(0, 3).join(". "));
    if (!accepted.length) return;

    const added: ListingPhoto[] = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      objectUrls.current.add(preview);
      return { id: newId(), file, preview };
    });
    const next = [...photos];
    next.splice(Math.min(Math.max(insertAt ?? next.length, 0), next.length), 0, ...added);
    update(next);
  };

  const move = (from: number, to: number) => {
    const photos = current();
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    update(next);
  };

  const remove = (index: number) => {
    if (index === 0) return; // the cover is replaced, never removed
    const photos = current();
    const photo = photos[index];
    if (photo) release(photo);
    update(photos.filter((_, i) => i !== index));
  };

  /** A new cover photo: it goes first, the old cover becomes the next photo. */
  const replaceCover = (files: FileList | null) => addFiles(files ? [files[0]!].filter(Boolean) : null, 0);

  // ── Drag and drop: reordering photos, or dropping new files in ──
  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  const onDragOver = (e: React.DragEvent, index: number) => {
    if (dragFrom === null && !isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = dragFrom === null ? "copy" : "move";
    if (dropAt !== index) setDropAt(index);
  };
  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragFrom !== null) move(dragFrom, Math.min(index, current().length - 1));
    else if (isFileDrag(e)) addFiles(e.dataTransfer.files, index);
    setDragFrom(null);
    setDropAt(null);
  };
  const endDrag = () => {
    setDragFrom(null);
    setDropAt(null);
  };

  const cover = photos[0];
  const gallery = photos.slice(1);
  const missing = Math.max(0, MIN_LISTING_PHOTOS - photos.length);
  const full = photos.length >= MAX_LISTING_PHOTOS;

  return (
    <div className="space-y-4" id={name}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-widest text-gray-500">
          Photos <span className="text-red-500">*</span>
        </span>
        <span className={cn("text-[10px] tracking-wider", missing ? "text-amber-700" : "text-gray-400")}>
          {photos.length} / {MAX_LISTING_PHOTOS}
          {missing ? ` · ${missing} more needed` : ""}
        </span>
      </div>

      {/* Cover */}
      <div
        className={cn(
          "relative w-full aspect-4/3 border bg-white transition-colors",
          dropAt === 0 ? "border-luxury-gold ring-2 ring-luxury-gold/30" : "border-gray-200",
        )}
        onDragOver={(e) => onDragOver(e, 0)}
        onDragLeave={() => setDropAt(null)}
        onDrop={(e) => onDrop(e, 0)}
      >
        {cover ? (
          <div className="group relative h-full w-full p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.preview} alt="Cover photo" className="h-full w-full object-cover" draggable={false} />
            <span className="absolute left-4 top-4 bg-luxury-black/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-white">
              Cover
            </span>
            <label className="absolute bottom-4 right-4 cursor-pointer bg-white/95 px-3 py-2 text-[9px] font-semibold uppercase tracking-widest text-luxury-black shadow-sm transition-colors hover:text-luxury-gold">
              Change cover
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  replaceCover(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <label className="group flex h-full w-full cursor-pointer flex-col items-center justify-center px-6 text-center transition-colors hover:bg-gray-50">
            <span className="mb-4 rounded-full bg-gray-50 p-4 transition-colors group-hover:bg-luxury-gold/10">
              <ImagePlus size={24} strokeWidth={1} className="text-luxury-charcoal group-hover:text-luxury-gold" />
            </span>
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-luxury-black">
              Add photos
            </span>
            <span className="text-[11px] text-gray-400">
              Select or drop several at once. The first one becomes the cover.
            </span>
            <input
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Gallery: every photo after the cover, in order */}
      {cover && (
        <div className="grid grid-cols-3 gap-3">
          {gallery.map((photo, i) => {
            const index = i + 1;
            return (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDragFrom(index);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={endDrag}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                className={cn(
                  "group relative aspect-square cursor-grab border bg-white p-1 active:cursor-grabbing",
                  dropAt === index && dragFrom !== index ? "border-luxury-gold ring-2 ring-luxury-gold/30" : "border-gray-200",
                  dragFrom === index ? "opacity-40" : "",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" draggable={false} />
                <span className="absolute left-2 top-2 bg-white/90 px-1.5 text-[9px] font-semibold text-luxury-black">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute -right-2 -top-2 z-10 rounded-full border border-gray-200 bg-white p-1 text-luxury-black shadow-sm transition-colors hover:text-red-600"
                >
                  <XIcon size={10} />
                </button>
                {/* Always visible on touch screens, on hover elsewhere */}
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between bg-white/90 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 1}
                    aria-label={`Move photo ${index + 1} earlier`}
                    className="p-1 text-gray-600 hover:text-luxury-gold disabled:opacity-30"
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 0)}
                    aria-label={`Make photo ${index + 1} the cover`}
                    title="Make cover"
                    className="p-1 text-gray-600 hover:text-luxury-gold"
                  >
                    <Star size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === photos.length - 1}
                    aria-label={`Move photo ${index + 1} later`}
                    className="p-1 text-gray-600 hover:text-luxury-gold disabled:opacity-30"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {!full && (
            <label
              onDragOver={(e) => onDragOver(e, photos.length)}
              onDragLeave={() => setDropAt(null)}
              onDrop={(e) => onDrop(e, photos.length)}
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed bg-white text-center transition-colors hover:border-luxury-gold hover:bg-gray-50",
                dropAt === photos.length ? "border-luxury-gold" : "border-gray-300",
              )}
            >
              <ImagePlus size={18} strokeWidth={1.5} className="text-gray-400" />
              <span className="mt-2 px-1 text-[9px] uppercase tracking-widest text-gray-500">Add photos</span>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-gray-400">
        At least {MIN_LISTING_PHOTOS} photos, up to {MAX_LISTING_PHOTOS}. Drag photos to change their order, or use
        the arrows. Use ★ to make a photo the cover. JPG, PNG or WebP, up to 25 MB each.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
