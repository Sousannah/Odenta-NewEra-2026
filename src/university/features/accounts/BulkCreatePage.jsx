import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  Link2,
  MinusCircle,
  SkipForward,
  Upload,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { formatNumber } from "@/lib/format";
import { ROLE_META, ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Select, Switch, Textarea } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SegmentedControl } from "@/components/ui/Tabs";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";

const SAMPLE = `Yara Hassan, yara.hassan@student.aiu.edu.eg, 20261501
Omar Fouad, omar.fouad@student.aiu.edu.eg, 20261502
Salma Mansour, salma.mansour@student.aiu.edu.eg, 20261503`;

const OUTCOME = {
  created: { tone: "success", icon: <CheckCircle2 className="h-3 w-3" />, label: "Created" },
  skipped: { tone: "warning", icon: <MinusCircle className="h-3 w-3" />, label: "Skipped" },
  rejected: { tone: "danger", icon: <AlertTriangle className="h-3 w-3" />, label: "Rejected" },
  ok: { tone: "neutral", icon: null, label: "Ready" },
};

/** The hard ceiling the server enforces per request — see `MAX_BULK_ROWS`. */
const BATCH_LIMIT = 200;

/**
 * Cohort creation.
 *
 * Two entry paths, because an IT administrator genuinely has two problems:
 *
 *   **Paste** is for the twenty rows in an email. Parsed in the browser first,
 *   so the preview is honest before anything is sent.
 *
 *   **A CSV file** is for the real thing — the export a university's records
 *   system produces at the start of term. The bytes go from the browser
 *   *straight to blob storage* with a short-lived, single-blob, create-only
 *   capability and never pass through the API, which is the same rule the
 *   radiographs follow and for the same reasons: a 4 MB file has no business
 *   inside a request body sized for JSON.
 *
 * ## Why the report is a file
 *
 * An import has to hand back one credential per created account, or the
 * administrator has two hundred working logins and no way to tell anybody how
 * to sign in. Two hundred credentials is not something to read off a screen —
 * so for anything but a small batch the server writes a private CSV and returns
 * a short-lived link, rather than putting secrets in a response body that a
 * proxy might log and a browser will cache.
 *
 * Invitations are the default for exactly that reason: there is no credential to
 * distribute at all, and a cohort of two hundred costs the server no password
 * hashing whatsoever.
 */
export default function BulkCreatePage() {
  const toast = useToast();

  const [mode, setMode] = useState("paste");
  const [role, setRole] = useState(ROLES.UNI_STUDENT);
  const [credentialMode, setCredentialMode] = useState("invite");
  const [mfaRequired, setMfaRequired] = useState(false);

  const [raw, setRaw] = useState("");
  const [file, setFile] = useState(null);
  const [upload, setUpload] = useState(null);
  const [preview, setPreview] = useState(null);

  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /* ------------------------------------------------------------ the paste */

  /**
   * Parsed client-side first so the preview is honest before anything is sent.
   *
   * The same checks the server applies, which is the point: a row rejected here
   * would have been rejected there, so the preview is a prediction rather than a
   * guess. The server remains the authority — it is the only thing that knows
   * whether an address is already taken.
   */
  const parsed = useMemo(() => {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, email, reference] = line.split(",").map((part) => part?.trim() ?? "");
        const problems = [];
        if (!name) problems.push("missing name");
        if (!email) problems.push("missing email");
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) problems.push("email looks wrong");
        else if (role === ROLES.UNI_STUDENT && !reference) problems.push("missing student number");
        return { line: index + 1, name, email, reference: reference || null, problems };
      });
  }, [raw, role]);

  const invalid = parsed.filter((row) => row.problems.length);
  const importable = parsed.length - invalid.length;

  const submitPaste = async () => {
    if (!parsed.length) {
      setError("Paste at least one line before importing.");
      return;
    }
    if (parsed.length > BATCH_LIMIT) {
      setError(
        `Paste at most ${BATCH_LIMIT} lines at a time. For a larger cohort, upload the CSV instead — it imports in pages.`
      );
      return;
    }

    setBusy("paste");
    setError(null);
    try {
      const outcome = await universityService.bulkCreateAccounts(
        parsed.map((row) => ({
          name: row.name,
          email: row.email,
          reference: row.reference,
          role,
        })),
        {
          role,
          credentialMode,
          mfaRequired,
          /* Small batches can show their credentials on screen; large ones get
             the file, because two hundred secrets in a browser is not a plan. */
          returnCredentials: parsed.length <= 40,
        }
      );
      setResult(outcome);
      announce(toast, outcome);
    } catch (cause) {
      setError(cause?.message ?? "The import could not be run");
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------- the file */

  const inputRef = useRef(null);

  const chooseFile = async (chosen) => {
    setError(null);
    setResult(null);
    setPreview(null);
    setUpload(null);

    if (!chosen) return;
    if (!/\.csv$/i.test(chosen.name) && chosen.type !== "text/csv") {
      setError("Choose a CSV file. Save an Excel sheet as CSV first.");
      return;
    }
    setFile(chosen);

    /**
     * Uploaded and previewed in one go.
     *
     * The preview is a `dryRun` against the file the server now holds, rather
     * than a second parse in the browser — so what the administrator approves
     * is exactly what the import will do, including the columns the server
     * recognised in their header row.
     */
    setBusy("upload");
    try {
      const capability = await universityService.uploadCohortFile(chosen);
      setUpload(capability);

      const dry = await universityService.importAccounts({
        path: capability.path,
        role,
        dryRun: true,
      });
      setPreview(dry);
    } catch (cause) {
      setError(cause?.message ?? "That file could not be read");
      setFile(null);
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    if (!upload) return;
    setBusy("import");
    setError(null);
    try {
      const outcome = await universityService.importAccounts({
        path: upload.path,
        role,
        credentialMode,
        mfaRequired,
      });
      setResult(outcome);
      announce(toast, outcome);
    } catch (cause) {
      setError(cause?.message ?? "The import could not be run");
    } finally {
      setBusy(null);
    }
  };

  const clear = () => {
    setRaw("");
    setFile(null);
    setUpload(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const rowsToImport = mode === "paste" ? importable : (preview?.importable ?? 0);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Import a cohort"
        description="Create many accounts at once. Each row becomes a login and the person behind it, so they appear in People and the cohort lists immediately."
        actions={
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            leftIcon={<Download className="h-4 w-4" />}
          >
            CSV template
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------------- the input */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="The cohort"
            subtitle="Paste a short list, or upload the export from your records system"
            action={
              <SegmentedControl
                value={mode}
                onChange={setMode}
                options={[
                  { value: "paste", label: "Paste" },
                  { value: "file", label: "CSV file" },
                ]}
              />
            }
          />
          <CardBody className="flex flex-col gap-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Role for this batch"
                hint="a row may name its own"
              >
                <Select value={role} onChange={(event) => setRole(event.target.value)}>
                  {ASSIGNABLE_ROLES.map((value) => (
                    <option key={value} value={value}>
                      {ROLE_META[value].label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="First sign-in">
                <Select
                  value={credentialMode}
                  onChange={(event) => setCredentialMode(event.target.value)}
                >
                  <option value="invite">Send invitation links</option>
                  <option value="temporary">Temporary passwords</option>
                </Select>
              </Field>
            </div>

            {credentialMode === "invite" ? (
              <InfoBanner tone="info" icon={<Link2 className="h-4 w-4" />}>
                Each person gets a single-use link and sets their own password. Nothing secret is
                stored or displayed, and a large cohort imports far faster — there is no password
                to hash.
              </InfoBanner>
            ) : (
              <InfoBanner tone="warning" icon={<KeyRound className="h-4 w-4" />}>
                Every row gets a generated password you must hand over. For more than forty rows
                they are written to a downloadable report rather than shown here — treat that file
                as a list of live credentials and delete it once distributed.
              </InfoBanner>
            )}

            {mode === "paste" ? (
              <Field
                label="Rows"
                hint="name, email, student number — one per line"
                counter={`${parsed.length} line(s)`}
              >
                <Textarea
                  rows={12}
                  value={raw}
                  onChange={(event) => setRaw(event.target.value)}
                  placeholder={SAMPLE}
                  className="font-mono text-[12.5px]"
                />
              </Field>
            ) : (
              <CsvDropZone
                file={file}
                busy={busy === "upload"}
                inputRef={inputRef}
                onChoose={chooseFile}
                onClear={clear}
              />
            )}

            {mode === "paste" && !raw ? (
              <Button variant="link" size="sm" className="self-start" onClick={() => setRaw(SAMPLE)}>
                Use a sample
              </Button>
            ) : null}

            {mode === "paste" && invalid.length ? (
              <InfoBanner tone="warning">
                {invalid.length} line{invalid.length === 1 ? "" : "s"} look wrong and will be
                rejected. They are listed in the preview.
              </InfoBanner>
            ) : null}

            {preview?.remaining ? (
              <InfoBanner tone="info">
                This file has {formatNumber(preview.total)} rows. The first {BATCH_LIMIT} import
                now — run it again afterwards for the rest. Re-importing is safe: anybody who
                already has an account is skipped.
              </InfoBanner>
            ) : null}

            {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

            <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
              <Switch
                checked={mfaRequired}
                onChange={setMfaRequired}
                label="Require MFA for every account in this batch"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">
                  Require MFA for this batch
                </span>
                <span className="block text-[12px] text-ink-muted">
                  There is no self-service enrolment yet, so these accounts cannot sign in until
                  you enrol them. Leave off for a student cohort.
                </span>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={clear} disabled={Boolean(busy)}>
                Clear
              </Button>
              <Button
                onClick={mode === "paste" ? submitPaste : runImport}
                loading={busy === "paste" || busy === "import"}
                disabled={mode === "paste" ? !parsed.length : !upload || !preview?.importable}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                Create {rowsToImport ? formatNumber(rowsToImport) : ""} account
                {rowsToImport === 1 ? "" : "s"}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* ----------------------------------------------------- the preview */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Preview"
            subtitle={
              mode === "paste"
                ? `${importable} row(s) look importable`
                : preview
                  ? `${preview.importable} of ${preview.total} row(s) look importable`
                  : "Upload a file to see what it contains"
            }
          />
          <CardBody className="pt-2">
            <PreviewList rows={mode === "paste" ? parsed : (preview?.results ?? [])} />
          </CardBody>
        </Card>
      </div>

      {result ? <Result result={result} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------ the pieces */

const ASSIGNABLE_ROLES = [
  ROLES.UNI_STUDENT,
  ROLES.UNI_SUPERVISOR,
  ROLES.UNI_ASSISTANT,
  ROLES.UNI_ADMIN,
  ROLES.UNI_IT,
];

/**
 * The blank cohort file, generated here rather than downloaded.
 *
 * The API serves the same template at `/university/accounts/import/template`,
 * and a plain `<a href>` to it looked like the obvious way to offer it — but
 * that request carries no `Authorization` header, because the access token
 * lives in memory rather than in a cookie precisely so an injected script
 * cannot read it. Against a live API the link would 401, and it would do so
 * only in production.
 *
 * So the browser writes its own. The column names are the ones `rowsFromCsv`
 * recognises on the server, and its header matching is deliberately permissive
 * — "Full Name", "E-mail", "Student ID" all work — so this cannot drift into
 * producing a file the importer rejects.
 */
function downloadTemplate() {
  const csv =
    "﻿name,email,student number,role,academic year,group\r\n" +
    "Yara Hassan,yara.hassan@student.aiu.edu.eg,20261501,uni_student,year_3,Group A\r\n" +
    "Omar Fouad,omar.fouad@student.aiu.edu.eg,20261502,uni_student,year_3,Group A\r\n" +
    "Nadia Samir,nadia.samir@aiu.edu.eg,USTF-11,uni_assistant,,\r\n";

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "odenta-cohort-template.csv";
  link.click();
  /* Released on the next tick — revoking synchronously races the download in
     Safari, which has not started reading the blob when `click()` returns. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const announce = (toast, outcome) => {
  if (outcome.created) {
    toast.success(
      `${formatNumber(outcome.created)} account${outcome.created === 1 ? "" : "s"} created`,
      outcome.rejected ? `${outcome.rejected} row(s) rejected` : undefined
    );
    return;
  }
  toast.error("Nothing was created", `${outcome.rejected} rejected, ${outcome.skipped} skipped`);
};

/**
 * The drop zone.
 *
 * Hand-rolled rather than using the shared `FileDrop`, which maps its input to
 * a display descriptor and discards the underlying `File` — fine for a gallery
 * thumbnail, useless when the bytes have to be PUT to storage.
 */
function CsvDropZone({ file, busy, inputRef, onChoose, onClear }) {
  const [dragging, setDragging] = useState(false);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
          <FileSpreadsheet className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-ink">{file.name}</span>
          <span className="block text-[12px] text-ink-soft">
            {(file.size / 1024).toFixed(1)} KB
            {busy ? " · uploading and checking…" : " · uploaded"}
          </span>
        </span>
        <Button variant="ghost" size="xs" onClick={onClear} aria-label="Remove the file">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onChoose(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-12 text-center transition",
        dragging ? "border-brand-500 bg-brand-50/60" : "border-slate-200 bg-white"
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-ink-soft">
        <Upload className="h-5 w-5" />
      </span>
      <p className="text-[13.5px] font-bold text-ink">Drop the cohort CSV here</p>
      <p className="max-w-sm text-[12.5px] text-ink-muted">
        A header row is detected automatically. Without one, the columns are read as name, email,
        student number.
      </p>
      <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
        Choose a file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => onChoose(event.target.files?.[0])}
      />
      <p className="text-[11px] text-ink-faint">Up to 4 MB. The file goes straight to storage.</p>
    </div>
  );
}

/** The rows, with whatever is wrong with each one. */
function PreviewList({ rows }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-soft">
          <Users className="h-6 w-6" />
        </span>
        <p className="text-[13.5px] font-bold text-ink">Nothing to import yet</p>
        <p className="max-w-xs text-[12.5px] text-ink-muted">
          Each row becomes one account. The reference column is the student number or staff ID.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
      {rows.map((row) => {
        /* The paste path reports `problems`; the server's dry run reports a
           `status` and a `reason`. One list renders both. */
        const problem = row.problems?.[0] ?? (row.status === "rejected" ? row.reason : null);
        return (
          <li
            key={row.line}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5",
              problem ? "border-danger/30 bg-danger-soft/40" : "border-slate-200"
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-ink">
                {row.name || "—"}
              </span>
              <span className="block truncate text-[12px] text-ink-soft">
                {row.email || "no email"}
                {row.reference ? ` · ${row.reference}` : ""}
              </span>
            </span>
            {problem ? (
              <Badge tone="danger">{problem}</Badge>
            ) : (
              <span className="shrink-0 text-[11px] font-bold text-ink-faint">
                line {row.line}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** What the import actually did, per row. */
function Result({ result }) {
  const columns = [
    { key: "line", header: "Line", width: "70px", sortable: true },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => <span className="text-[13px] text-ink">{row.name || "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12.5px] text-ink">{row.email || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Outcome",
      sortable: true,
      render: (row) => {
        const meta = OUTCOME[row.status] ?? OUTCOME.rejected;
        return (
          <Badge tone={meta.tone}>
            {meta.icon}
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "detail",
      header: "Detail",
      render: (row) => (
        <span className="text-[13px] text-ink-muted">
          {row.reason ?? (row.staffId ? `Issued ${row.staffId}` : "—")}
        </span>
      ),
    },
    /**
     * Only present for a small batch that asked for credentials inline.
     *
     * Rendered `select-all` and monospaced, because the whole value has to be
     * copyable in one gesture — a partial selection is how somebody pastes
     * fifteen of sixteen characters and reports that the password is wrong.
     */
    {
      key: "credential",
      header: "Credential",
      render: (row) =>
        row.temporaryPassword || row.activationToken ? (
          <span className="select-all break-all font-mono text-[12px] font-semibold text-ink">
            {row.temporaryPassword ?? row.activationToken}
          </span>
        ) : (
          <span className="text-[12px] text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <>
      <StatGrid cols={4}>
        <StatCard
          label="Rows submitted" value={formatNumber(result.total)}
          icon={<FileSpreadsheet className="h-5 w-5" />}
        />
        <StatCard
          label="Created" value={formatNumber(result.created)} tone="success"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatCard
          label="Skipped" value={formatNumber(result.skipped)} tone="warning"
          icon={<SkipForward className="h-5 w-5" />}
        />
        <StatCard
          label="Rejected" value={formatNumber(result.rejected)} tone="danger"
          icon={<XCircle className="h-5 w-5" />}
        />
      </StatGrid>

      {result.report ? (
        <InfoBanner
          tone="info"
          action={
            <Button
              size="xs"
              as="a"
              href={result.report.url}
              download
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Download
            </Button>
          }
        >
          The credentials for {formatNumber(result.created)} new account
          {result.created === 1 ? "" : "s"} are in a private report. The link is short-lived and
          the file holds live credentials — distribute it and then delete it.
        </InfoBanner>
      ) : null}

      {result.remaining ? (
        <InfoBanner tone="warning">
          {formatNumber(result.remaining)} row{result.remaining === 1 ? "" : "s"} from that file
          have not been imported yet. Press the button again to continue — anybody already created
          will be skipped.
        </InfoBanner>
      ) : null}

      <DataTable
        columns={columns}
        rows={result.results}
        rowKey={(row) => row.line}
        dense
        emptyTitle="Nothing imported"
      />
    </>
  );
}
