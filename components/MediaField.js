"use client";
import { useRef, useState } from "react";
import Icon from "./Icon";

const RULES = {
  photo: { accept: "image/jpeg,image/png,image/webp", max: 10, types: ["image/jpeg", "image/png", "image/webp"] },
  video: { accept: "video/mp4,video/quicktime,video/webm", max: 300, types: ["video/mp4", "video/quicktime", "video/webm"] }
};

function videoKind(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return "YouTube video";
  if (/drive\.google\.com/.test(url)) return "Google Drive video";
  if (/vimeo\.com/.test(url)) return "Vimeo video";
  return null;
}

export default function MediaField({ kind, label, value, onChange, uploads, name }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");
  const rule = RULES[kind];

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!rule.types.includes(file.type)) {
      setError(kind === "photo" ? "Use a JPG, PNG or WebP photo." : "Use an MP4, MOV or WebM video.");
      return;
    }
    if (file.size > rule.max * 1024 * 1024) {
      setError(`That file is over ${rule.max} MB. ${kind === "video" ? "Upload it to YouTube as Unlisted and paste the link instead." : "Use a smaller photo."}`);
      return;
    }
    setBusy(true);
    setPct(0);
    try {
      let url;
      const ext = (file.name.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase();
      const base = String(name || kind).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || kind;
      if (uploads === "blob") {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`${kind === "video" ? "videos" : "photos"}/${base}${ext}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: kind,
          multipart: file.size > 40 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setPct(Math.round(percentage))
        });
        url = blob.url;
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload-local", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed. Try again.");
        url = data.url;
      }
      onChange(url);
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const embedded = kind === "video" && value ? videoKind(value) : null;

  return (
    <div className="media">
      <div className="media-label">{label}</div>
      <div className="media-body">
        <div className={`media-preview ${kind}`}>
          {value ? (
            kind === "photo" ? (
              <img src={value} alt="" />
            ) : embedded ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="media-linked"><Icon name="play" size={22} /><span>{embedded}</span></a>
            ) : (
              <video src={value} controls preload="metadata" playsInline />
            )
          ) : (
            <span className="media-none"><Icon name={kind === "photo" ? "image" : "film"} size={26} /></span>
          )}
        </div>
        <div className="media-controls">
          <div className="media-buttons">
            <input ref={input} type="file" accept={rule.accept} onChange={onFile} hidden />
            <button type="button" className="btn sm" onClick={() => input.current?.click()} disabled={busy}>
              <Icon name="upload" />{busy ? (pct ? `Uploading ${pct}%` : "Uploading…") : value ? "Replace" : "Upload"}
            </button>
            {value && !busy && (
              <button type="button" className="btn ghost sm" onClick={() => onChange("")}><Icon name="trash-2" />Remove</button>
            )}
          </div>
          <label className="media-or">
            <span>or paste a link</span>
            <input
              type="url"
              value={value}
              placeholder={kind === "photo" ? "https://…/photo.jpg" : "YouTube, Google Drive or video link"}
              onChange={(e) => onChange(e.target.value.trim())}
            />
          </label>
          <p className="hint">
            {kind === "photo"
              ? "A square, well-lit headshot works best. JPG, PNG or WebP, up to 10 MB."
              : "Upload an MP4 up to 300 MB, or paste a YouTube (Unlisted is fine), Google Drive or Vimeo link. Drive videos must be shared as 'Anyone with the link'."}
          </p>
          {error && <p className="a-err" role="alert"><Icon name="circle-alert" />{error}</p>}
        </div>
      </div>
    </div>
  );
}
