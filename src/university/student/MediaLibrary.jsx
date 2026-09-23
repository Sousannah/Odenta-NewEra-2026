import { useState } from "react";
import { Download, Images, Pencil, Plus, Scan, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";
import { MediaUploadModal } from "./MediaUploadModal";

/**
 * A patient's images.
 *
 * Photographs and radiographs are the same interaction — add, annotate, open,
 * delete — over two different lists, so one component drives both tabs. Notes
 * matter more than the file names: "pre-op, distal caries visible" is what a
 * supervisor reads, and it is what makes an image usable six weeks later.
 */

const KIND = {
  gallery: {
    title: "Patient gallery",
    description: "Clinical photographs taken through the course of treatment.",
    empty: "No images yet",
    emptyHint: "Add intraoral or extraoral photographs to build the visual record.",
    addLabel: "Add images",
    icon: <Images className="h-6 w-6" />,
    fit: "object-cover",
    load: (caseId) => universityService.getCaseGallery(caseId),
    annotate: universityService.annotateCaseGallery,
    remove: universityService.removeCaseGallery,
    noun: "image",
  },
  xray: {
    title: "X-ray images",
    description: "Radiographs on file, newest first.",
    empty: "No X-rays yet",
    emptyHint: "Add periapicals, bitewings or a panoramic to the record.",
    addLabel: "Add X-rays",
    icon: <Scan className="h-6 w-6" />,
    fit: "object-contain bg-slate-900",
    load: (caseId) => universityService.getCaseXrays(caseId),
    annotate: universityService.annotateCaseXray,
    remove: universityService.removeCaseXray,
    noun: "X-ray",
  },
};

export function MediaLibrary({ record, kind }) {
  const meta = KIND[kind];
  const toast = useToast();
  const caseId = record.id;

  const { data: items = [], loading, refetch } = useAsync(() => meta.load(caseId), [caseId, kind], []);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(null);

  const saveNote = async (item) => {
    try {
      await meta.annotate(caseId, item.id, note);
      setEditingId(null);
      setNote("");
      refetch();
    } catch (error) {
      toast.error("Could not save the note", error?.message);
    }
  };

  const remove = async (item) => {
    try {
      await meta.remove(caseId, item.id);
      refetch();
      toast.success(`${meta.noun[0].toUpperCase()}${meta.noun.slice(1)} deleted`);
    } catch (error) {
      toast.error(`Could not delete the ${meta.noun}`, error?.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title={meta.title}
        description={meta.description}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
            {meta.addLabel}
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={meta.icon}
          title={meta.empty}
          description={meta.emptyHint}
          className="od-card py-16"
          action={
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              {meta.addLabel}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card as="li" key={item.id} className="overflow-hidden">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => setViewing(item)}
                  className="od-focus block w-full"
                >
                  <img
                    src={item.url}
                    alt={item.label ?? meta.noun}
                    className={cn("h-48 w-full", meta.fit)}
                  />
                </button>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <IconButton
                    size="sm"
                    label={`Delete ${meta.noun}`}
                    className="bg-white/95 text-danger shadow-sm hover:bg-white"
                    onClick={() => setConfirming(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
                {item.aiReviewed ? (
                  <Badge tone="brand" className="absolute left-2 top-2">
                    AI reviewed
                  </Badge>
                ) : null}
              </div>

              <CardBody className="flex flex-col gap-2 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      {item.label ?? "Untitled"}
                    </span>
                    <span className="block text-[11.5px] text-ink-soft">
                      {item.kind} · {formatDate(item.date ?? item.capturedAt, "d MMM yyyy")}
                    </span>
                  </span>
                  <Button
                    variant="link"
                    size="xs"
                    leftIcon={<Pencil className="h-3 w-3" />}
                    onClick={() => {
                      setEditingId(item.id);
                      setNote(item.note ?? "");
                    }}
                  >
                    {item.note ? "Edit note" : "Add note"}
                  </Button>
                </div>

                {editingId === item.id ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      rows={2}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={`Add a note about this ${meta.noun}…`}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="xs" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="xs" onClick={() => saveNote(item)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : item.note ? (
                  <p className="text-[12.5px] leading-relaxed text-ink-muted">{item.note}</p>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </ul>
      )}

      {/* ------------------------------------------------------- lightbox */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.label ?? meta.noun}
        description={
          viewing
            ? `${viewing.kind} · ${formatDate(viewing.date ?? viewing.capturedAt, "d MMM yyyy")}`
            : undefined
        }
        size="xl"
        bodyClassName="max-h-[76vh] overflow-y-auto px-6 py-5"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button
              as="a"
              href={viewing?.url}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Open original
            </Button>
          </>
        }
      >
        {viewing ? (
          <div className="flex flex-col gap-4">
            <img
              src={viewing.url}
              alt={viewing.label ?? meta.noun}
              className={cn(
                "max-h-[54vh] w-full rounded-xl object-contain",
                kind === "xray" && "bg-slate-900"
              )}
            />
            {viewing.note ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-ink-muted">
                {viewing.note}
              </p>
            ) : null}
            <p className="text-[12px] text-ink-faint">Captured by {viewing.by ?? "—"}</p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() => remove(confirming)}
        title={`Delete this ${meta.noun}?`}
        description="This removes it from the patient's record. It cannot be undone."
        confirmLabel="Delete"
      />

      <MediaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        kind={kind}
        caseId={caseId}
        patientName={record.patientName}
        onUploaded={() => {
          setUploadOpen(false);
          refetch();
          toast.success(kind === "xray" ? "X-rays added" : "Images added", record.patientName);
        }}
      />
    </div>
  );
}
