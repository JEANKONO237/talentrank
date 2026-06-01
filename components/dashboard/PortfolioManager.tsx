"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Film, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { Field, Input } from "@/components/auth/fields";
import {
  addPortfolioItem,
  createPortfolioUploadUrl,
  deletePortfolioItem,
  updatePortfolioItem,
} from "@/lib/server-actions/portfolio";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PortfolioItemRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

interface Props {
  items: PortfolioItemRow[];
}

export function PortfolioManager({ items: initial }: Props) {
  const [items, setItems] = useState<PortfolioItemRow[]>(initial);
  const [open, setOpen] = useState(false);

  const refresh = () => location.reload();

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-mist-400">
          {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
          {items.filter((i) => i.is_featured).length} featured
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Add work
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full glass-panel p-10 text-center">
            <p className="font-display text-[16px] text-mist-50">No work yet.</p>
            <p className="mt-1 text-[13px] text-mist-400">
              Add a showreel link or upload an image to start filling your portfolio.
            </p>
          </div>
        )}
        {items.map((item) => (
          <PortfolioCard
            key={item.id}
            item={item}
            onToggleFeatured={async () => {
              await updatePortfolioItem(item.id, { is_featured: !item.is_featured });
              refresh();
            }}
            onSetCover={async () => {
              await updatePortfolioItem(item.id, { is_cover: true });
              refresh();
            }}
            onDelete={async () => {
              if (!confirm("Delete this item?")) return;
              await deletePortfolioItem(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            }}
          />
        ))}
      </div>

      {open && <AddItemDialog onClose={() => setOpen(false)} onAdded={refresh} />}
    </div>
  );
}

function PortfolioCard({
  item,
  onToggleFeatured,
  onSetCover,
  onDelete,
}: {
  item: PortfolioItemRow;
  onToggleFeatured: () => void;
  onSetCover: () => void;
  onDelete: () => void;
}) {
  const gradient = item.gradient ?? "from-cyan-400 via-cyan-600 to-indigo-900";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-700/40 bg-ink-875/60">
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
        <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
        {item.kind === "video" && (
          <div className="absolute right-3 top-3">
            <Pill tone="cyan">
              <Film className="h-3 w-3" /> Video
            </Pill>
          </div>
        )}
        {item.is_cover && (
          <div className="absolute left-3 top-3">
            <Pill tone="amber">
              <Star className="h-3 w-3" /> Cover
            </Pill>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate font-display text-[14px] font-semibold text-mist-50">{item.title}</p>
          {item.is_featured && <Pill tone="violet">Featured</Pill>}
        </div>
        {item.subtitle && <p className="mt-0.5 truncate text-[12px] text-mist-400">{item.subtitle}</p>}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onToggleFeatured}
            className="text-[12px] text-mist-300 hover:text-mist-50 inline-flex items-center gap-1"
          >
            <Star className={cn("h-3.5 w-3.5", item.is_featured && "fill-amber-300 text-amber-300")} />
            {item.is_featured ? "Unfeature" : "Feature"}
          </button>
          {!item.is_cover && (
            <button onClick={onSetCover} className="text-[12px] text-cyan-300 hover:text-cyan-200">
              Set as cover
            </button>
          )}
          <button onClick={onDelete} className="text-mist-400 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title required.");
      return;
    }
    startTransition(async () => {
      let storagePath: string | null = null;
      let kind: "image" | "video" = "image";

      if (file) {
        // Detect kind from MIME
        kind = file.type.startsWith("video/") ? "video" : "image";
        setProgress("Requesting upload URL…");
        const signed = await createPortfolioUploadUrl(file.name);
        if (!signed.ok) {
          setError(signed.error);
          return;
        }
        setProgress("Uploading…");
        const supabase = getSupabaseBrowserClient();
        const upload = await supabase.storage
          .from("portfolios")
          .uploadToSignedUrl(signed.data!.path, signed.data!.token, file);
        if (upload.error) {
          setError(upload.error.message);
          return;
        }
        storagePath = signed.data!.path;
      } else if (externalUrl) {
        kind = /youtu\.?be|vimeo/.test(externalUrl) ? "video" : "image";
      } else {
        setError("Upload a file or paste a URL.");
        return;
      }

      setProgress("Saving…");
      const res = await addPortfolioItem({
        kind,
        title,
        subtitle: subtitle || null,
        storage_path: storagePath,
        external_url: externalUrl || null,
        ratio: "16/9",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setProgress(null);
      onAdded();
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-mist-50/40 backdrop-blur-sm p-4">
      <div className="glass-panel relative w-full max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-mist-400 hover:bg-ink-850 hover:text-mist-50"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="font-display text-[20px] font-semibold text-mist-50">Add to portfolio</h2>
        <p className="mt-1 text-[12.5px] text-mist-400">
          Upload an image / short video, or paste a YouTube / Vimeo URL.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required maxLength={120} />
          </Field>
          <Field label="Subtitle (optional)">
            <Input value={subtitle} onChange={(e) => setSubtitle(e.currentTarget.value)} maxLength={200} />
          </Field>

          <Field label="File (image / video)" hint="Up to 500 MB. Image or video.">
            <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-ink-850 hover:bg-ink-850 text-mist-300 text-[13px]">
              {file ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-signal-green" /> {file.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Choose a file
                </span>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              />
            </label>
          </Field>

          <div className="hairline" />

          <Field label="Or external URL" hint="YouTube / Vimeo embed link.">
            <Input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.currentTarget.value)}
              placeholder="https://vimeo.com/…"
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {progress && (
            <div className="flex items-center gap-2 text-[13px] text-cyan-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {progress}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} disabled={isPending}>
              {isPending ? "Adding…" : "Add to portfolio"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
