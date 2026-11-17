"use client";
"use no memo";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Plus, X as XIcon } from "lucide-react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { isDirectVideoFile, toVideoEmbed } from "@/lib/utils/videoEmbed";

export const LABEL = "text-[10px] uppercase tracking-widest text-gray-500";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
      {children}
    </h3>
  );
}

/** A labelled checkbox registered on the form. */
export function CheckboxField({ id, label }: { id: string; label: string }) {
  const { register } = useFormContext();
  return (
    <div className="flex items-center gap-3">
      <input type="checkbox" id={id} {...register(id)} className="h-4 w-4 accent-luxury-gold" />
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
    </div>
  );
}

const COORDS = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/**
 * Where the asset is. Shown on the public page, with a map when a pin is set.
 * `baseLabel` adds the operating base / home port field (yachts, aircraft).
 */
export function LocationFields({ baseLabel, basePlaceholder }: { baseLabel?: string; basePlaceholder?: string }) {
  const { register, setValue, watch } = useFormContext();
  const lat = watch("latitude");
  const lng = watch("longitude");
  const hasPin = lat !== undefined && lat !== "" && lng !== undefined && lng !== "" && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  // Pasting "25.1189, 55.1336" (as Google Maps copies it) fills both boxes.
  const onPasteCoords = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const match = e.clipboardData.getData("text").match(COORDS);
    if (!match) return;
    e.preventDefault();
    setValue("latitude", match[1], { shouldValidate: true, shouldDirty: true });
    setValue("longitude", match[2], { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Location</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input labelClassName={LABEL} id="country" label="Country" placeholder="United Arab Emirates" register={register} />
        <Input labelClassName={LABEL} id="city" label="City / Emirate" placeholder="Dubai" register={register} />
        <Input labelClassName={LABEL} id="area" label="Area / Community" placeholder="e.g. Palm Jumeirah" register={register} />
      </div>
      <Input
        labelClassName={LABEL}
        id="address"
        label="Address"
        placeholder="Building, street or plot (hidden from the public if you tick the box below)"
        register={register}
      />
      {baseLabel && (
        <Input labelClassName={LABEL} id="operatingBase" label={baseLabel} placeholder={basePlaceholder} register={register} />
      )}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            labelClassName={LABEL}
            id="latitude"
            type="number"
            step="any"
            label="Map pin: latitude"
            placeholder="e.g. 25.1189"
            register={register}
            onPaste={onPasteCoords}
          />
          <Input
            labelClassName={LABEL}
            id="longitude"
            type="number"
            step="any"
            label="Map pin: longitude"
            placeholder="e.g. 55.1336"
            register={register}
            onPaste={onPasteCoords}
          />
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          In Google Maps, right-click the spot and click the numbers to copy them, then paste here; both boxes fill
          in. Leave empty for no map.
          {hasPin && (
            <>
              {" "}
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-luxury-gold underline underline-offset-2"
              >
                <MapPin size={11} /> Check the pin
              </a>
            </>
          )}
        </p>
        <CheckboxField id="hideExactLocation" label="Hide exact location (show the area only, not the address or exact pin)" />
      </div>
    </div>
  );
}

/** A small player under the video link, so the owner sees it plays before saving. */
function VideoPreview({ link }: { link?: string }) {
  const value = link?.trim();
  if (!value) {
    return (
      <p className="text-[11px] text-gray-400 leading-relaxed">
        Paste any YouTube, Vimeo or Google Drive link. For Drive, set sharing to “Anyone with the link”.
      </p>
    );
  }
  const embed = toVideoEmbed(value);
  const file = !embed && isDirectVideoFile(value);
  if (!embed && !file) return null; // the field shows why
  return (
    <div className="space-y-2">
      <div className="aspect-video w-full max-w-md overflow-hidden bg-black">
        {file ? (
          <video src={value} controls preload="metadata" className="h-full w-full" />
        ) : (
          <iframe
            key={embed!.embedUrl}
            src={embed!.embedUrl}
            title="Video preview"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            className="h-full w-full"
          />
        )}
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        {embed?.provider === "drive"
          ? "Preview of your Drive video. If it says you need access, open the file in Drive, click Share and set it to “Anyone with the link”."
          : embed?.provider === "youtube"
            ? "Preview of your YouTube video. Private videos, or videos with embedding turned off, can’t play on other websites; public and unlisted ones can."
            : "Preview of your video."}
      </p>
    </div>
  );
}

/** Video, virtual tour and the company's own reference. */
export function ListingExtrasFields() {
  const { register, watch } = useFormContext();
  const videoUrl: string | undefined = watch("videoUrl");
  return (
    <div className="space-y-8">
      <SectionTitle>Video &amp; reference</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          labelClassName={LABEL}
          id="videoUrl"
          label="Video link"
          placeholder="YouTube, Vimeo or Google Drive link"
          register={register}
        />
        <Input labelClassName={LABEL} id="vrTourUrl" label="Virtual tour link" placeholder="https://..." register={register} />
      </div>
      <VideoPreview link={videoUrl} />
      <Input
        labelClassName={LABEL}
        id="internalReferenceCode"
        label="Your reference code"
        placeholder="Internal stock / reference number"
        register={register}
      />
    </div>
  );
}

/**
 * A list of features: tick common ones, or type your own. Saved as a list of
 * names, shown under "Features" on the public page.
 */
export function FeaturePicker({
  name,
  label,
  suggestions,
  placeholder = "Add your own and press Enter",
}: {
  name: string;
  label: string;
  suggestions: string[];
  placeholder?: string;
}) {
  const { watch, setValue, getValues } = useFormContext();
  const value: string[] = watch(name) ?? [];
  const [draft, setDraft] = useState("");

  // Always start from the form's latest list, so quick clicks never undo each other.
  const current = (): string[] => getValues(name) ?? [];
  const set = (next: string[]) => setValue(name, next, { shouldDirty: true, shouldValidate: true });
  const includes = (list: string[], item: string) => list.some((v) => v.toLowerCase() === item.toLowerCase());
  const has = (item: string) => includes(value, item);
  const toggle = (item: string) => {
    const list = current();
    set(includes(list, item) ? list.filter((v) => v.toLowerCase() !== item.toLowerCase()) : [...list, item]);
  };
  const addDraft = () => {
    const list = current();
    const items = draft
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s.length <= 80 && !includes(list, s));
    if (items.length) set([...list, ...new Set(items)]);
    setDraft("");
  };

  const custom = value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()));

  return (
    <div className="space-y-3">
      <span className={LABEL}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {[...suggestions, ...custom].map((item) => {
          const on = has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] transition-colors",
                on
                  ? "border-luxury-gold bg-luxury-gold/10 text-luxury-black"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400",
              )}
            >
              {on ? <XIcon size={10} /> : <Plus size={10} />}
              {item}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={placeholder}
          className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-gold focus:outline-none placeholder:text-gray-300"
        />
        <button
          type="button"
          onClick={addDraft}
          className="shrink-0 border border-gray-200 px-4 text-[10px] uppercase tracking-widest text-gray-600 hover:border-luxury-gold hover:text-luxury-gold"
        >
          Add
        </button>
      </div>
    </div>
  );
}
