/**
 * Turns the video link an owner pasted into a link that can play inside the
 * listing page. Video sites only allow their player on other websites through
 * their "embed" address, so a normal share link would stay blank.
 *
 * Supported: YouTube (watch, youtu.be, Shorts, live, embed, with or without
 * ?si= / timestamps), Vimeo, and Google Drive files. Drive files still have to
 * be shared as "Anyone with the link"; nothing can play a private file.
 */

export type VideoProvider = "youtube" | "vimeo" | "drive";
export type VideoEmbed = { provider: VideoProvider; id: string; embedUrl: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,}$/;

const parse = (raw: string): URL | null => {
  const value = raw.trim();
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
};

/** Seconds from a YouTube start time like "90", "90s" or "1m30s". */
const startSeconds = (t: string | null): number | null => {
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !m[0]) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
};

const youtube = (url: URL): VideoEmbed | null => {
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v", "e"].includes(parts[0] ?? "")) id = parts[1] ?? null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;
  const start = startSeconds(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return {
    provider: "youtube",
    id,
    embedUrl: `https://www.youtube.com/embed/${id}?rel=0${start ? `&start=${start}` : ""}`,
  };
};

const vimeo = (url: URL): VideoEmbed | null => {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  // vimeo.com/123, vimeo.com/123/abcdef (unlisted), player.vimeo.com/video/123, vimeo.com/channels/x/123
  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.findIndex((p) => /^\d+$/.test(p));
  if (index < 0) return null;
  const id = parts[index]!;
  // Unlisted videos carry a private hash, as the next path part or ?h=.
  const hash = url.searchParams.get("h") ?? (host === "vimeo.com" && /^[a-f0-9]{6,}$/i.test(parts[index + 1] ?? "") ? parts[index + 1] : null);
  return {
    provider: "vimeo",
    id,
    embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`,
  };
};

const drive = (url: URL): VideoEmbed | null => {
  const host = url.hostname;
  if (host !== "drive.google.com" && host !== "docs.google.com") return null;
  // drive.google.com/file/d/ID/view, /file/d/ID/preview, /open?id=ID, /uc?id=ID
  const fromPath = url.pathname.match(/\/file\/(?:u\/\d+\/)?d\/([^/]+)/)?.[1];
  const id = fromPath ?? url.searchParams.get("id");
  if (!id || !DRIVE_ID.test(id)) return null;
  return { provider: "drive", id, embedUrl: `https://drive.google.com/file/d/${id}/preview` };
};

/** The playable version of a pasted video link, or null when it isn't a supported video link. */
export const toVideoEmbed = (raw: string | null | undefined): VideoEmbed | null => {
  if (!raw) return null;
  const url = parse(raw);
  if (!url) return null;
  return youtube(url) ?? vimeo(url) ?? drive(url);
};

/** A link straight to a video file (e.g. .mp4), which the browser can play itself. */
export const isDirectVideoFile = (raw: string | null | undefined) => {
  const url = raw ? parse(raw) : null;
  return !!url && url.protocol === "https:" && /\.(mp4|webm|mov|m4v)$/i.test(url.pathname);
};

/** Form check: empty, a supported video site, or a direct video file. */
export const isPlayableVideoLink = (raw: string | null | undefined) =>
  !raw?.trim() || !!toVideoEmbed(raw) || isDirectVideoFile(raw);
