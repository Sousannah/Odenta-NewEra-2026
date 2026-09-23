import { useEffect, useRef, useState } from "react";
import { Images, Scan, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Adding images to a record.
 *
 * The bytes go straight from the browser to storage and never touch the API.
 * Three steps:
 *
 *   1. ask the API for a write capability per file — a URL scoped to one blob,
 *      create-only, valid for minutes
 *   2. PUT the file to that URL
 *   3. post a descriptor naming the blob, which is what creates the row
 *
 * The reason is size: a radiograph is 4–20MB and a case carries a dozen.
 * Proxying that through the API would mean paying for the bandwidth twice and
 * holding a 20MB buffer in a process sized for JSON. It also means a file that
 * will be refused — wrong type, too large — is refused in step 1, before
 * anything has been transferred.
 *
 * A failure in step 2 leaves an orphaned blob and no row, which is the right
 * way round: storage has a lifecycle rule for unreferenced blobs, and a record
 * that points at a file that was never written would be a broken image in a
 * clinical gallery forever.
 */

const KIND_META = {
  gallery: {
    title: "Add gallery images",
    icon: <Images className="h-5 w-5" />,
    field: "Photograph type",
    options: ["intraoral", "extraoral", "portrait", "study model"],
  },
  xray: {
    title: "Add X-rays",
    icon: <Scan className="h-5 w-5" />,
    field: "Radiograph type",
    options: ["periapical", "bitewing", "panoramic", "occlusal", "cbct"],
  },
};

/**
 * Checked here so a student is told before they wait, and again on the server
 * before a write capability is issued. The client-side copy is a courtesy; the
 * server's is the rule.
 */
const MAX_BYTES = 10 * 1024 * 1024;

/** What the storage account will accept — mirrored from the API. */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/dicom"];

/**
 * Four at a time.
 *
 * Independent uploads should overlap, but a clinic wifi connection shared by a
 * whole cohort does not go faster when one student opens twelve sockets — it
 * goes slower, and the retries land on everyone else.
 */
const UPLOAD_CONCURRENCY = 4;

/** Run `task` over `items`, `size` at a time, preserving order in the result. */
async function inBatches(items, size, task) {
  const out = [];
  for (let start = 0; start < items.length; start += size) {
    const slice = items.slice(start, start + size);
    // eslint-disable-next-line no-await-in-loop -- batches are sequential by design
    const done = await Promise.all(slice.map((item, offset) => task(item, start + offset)));
    out.push(...done);
  }
  return out;
}

export function MediaUploadModal({ open, onClose, kind = "gallery", caseId, patientName, onUploaded }) {
  const meta = KIND_META[kind] ?? KIND_META.gallery;
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [imageKind, setImageKind] = useState(meta.options[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /* `{ done, total }` while an upload is running, null otherwise. A dozen
     radiographs take long enough that a bare spinner reads as a hang. */
  const [progress, setProgress] = useState(null);

  /* Object URLs outlive the component unless they are revoked. */
  useEffect(
    () => () => files.forEach((entry) => URL.revokeObjectURL(entry.preview)),
    [files]
  );

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setError("");
      setImageKind((KIND_META[kind] ?? KIND_META.gallery).options[0]);
    }
  }, [open, kind]);

  const accept = (list) => {
    const chosen = Array.from(list ?? []);
    const tooBig = chosen.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is larger than ${MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    const wrongType = chosen.find((file) => file.type && !ACCEPTED_TYPES.includes(file.type));
    if (wrongType) {
      setError(`${wrongType.name} is not an image type the clinic stores.`);
      return;
    }
    setError("");
    setFiles((prev) => [
      ...prev,
      ...chosen.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const remove = (id) =>
    setFiles((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((entry) => entry.id !== id);
    });

  const upload = async () => {
    if (!files.length) {
      setError("Select at least one image.");
      return;
    }
    setBusy(true);
    setError("");
    setProgress({ done: 0, total: files.length });

    try {
      /* Step 1 — one round trip for every file, so a rejected type or size
         costs nothing but the round trip. */
      const grants = await universityService.requestMediaUpload(
        caseId,
        files.map((entry) => ({
          name: entry.file.name,
          contentType: entry.file.type || "application/octet-stream",
          sizeBytes: entry.file.size,
          kind: imageKind,
        }))
      );

      /* Step 2 — straight to storage. Uploads run together because they are
         independent and a case of twelve radiographs is otherwise a minute of
         watching a spinner, but not unboundedly: a student on clinic wifi with
         twelve parallel 20MB PUTs gets worse throughput, not better. */
      const uploaded = await inBatches(grants, UPLOAD_CONCURRENCY, async (grant, index) => {
        const entry = files[index];

        /* A grant without an upload URL is a bug in the grant, not a mode to
           degrade into — registering a descriptor whose bytes were never
           written gives the gallery a row that can only ever render broken. */
        if (!grant.uploadUrl) {
          throw new Error(`${entry.file.name} was not granted an upload location.`);
        }

        const response = await fetch(grant.uploadUrl, {
          method: "PUT",
          headers: grant.headers ?? {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": entry.file.type,
          },
          body: entry.file,
        });
        if (!response.ok) {
          throw new Error(`${entry.file.name} could not be uploaded (${response.status}).`);
        }

        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));

        return {
          fileId: grant.fileId,
          path: grant.path,
          name: entry.file.name,
          label: entry.file.name.replace(/\.[^.]+$/, ""),
          kind: imageKind,
        };
      });

      /* Step 3 — the descriptors are what create the rows, and the response
         carries the read URLs the gallery renders. */
      const rows =
        kind === "xray"
          ? await universityService.addCaseXrays(caseId, uploaded)
          : await universityService.addCaseGallery(caseId, uploaded);

      setFiles([]);
      onUploaded?.(rows ?? uploaded);
    } catch (uploadError) {
      setError(uploadError?.message ?? "Upload failed. Try again.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.title}
      description={patientName ? `For ${patientName}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Select more files
          </Button>
          <Button loading={busy} onClick={upload} disabled={!files.length}>
            {progress ? `Uploading ${progress.done} of ${progress.total}` : `Upload${files.length ? ` (${files.length})` : ""}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        <Field label={meta.field}>
          <Select value={imageKind} onChange={(event) => setImageKind(event.target.value)}>
            {meta.options.map((option) => (
              <option key={option} value={option}>
                {option.replace(/\b\w/g, (char) => char.toUpperCase())}
              </option>
            ))}
          </Select>
        </Field>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            accept(event.dataTransfer.files);
          }}
          className={cn(
            "od-focus flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/50"
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
            {meta.icon ?? <Upload className="h-5 w-5" />}
          </span>
          <span className="text-[13px] font-bold text-ink">Click to select files</span>
          <span className="text-[12px] text-ink-soft">or drag and drop them here</span>
          <span className="mt-1 text-[11px] text-ink-faint">
            JPG, PNG or WebP · up to {MAX_BYTES / 1024 / 1024}MB each
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => accept(event.target.files)}
        />

        {files.length ? (
          <div>
            <h4 className="mb-2 text-[13px] font-bold text-ink">Selected files ({files.length})</h4>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {files.map((entry) => (
                <li key={entry.id} className="min-w-0">
                  <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={entry.preview}
                      alt={entry.file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${entry.file.name}`}
                      onClick={() => remove(entry.id)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-danger opacity-0 shadow-sm transition group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 truncate text-[11.5px] font-semibold text-ink">
                    {entry.file.name}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
