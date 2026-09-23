import { useMemo, useState } from "react";
import { KeyRound, Link2, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { ROLE_META, ROLES } from "@/auth/roles";
import { ACADEMIC_YEARS } from "@/config/academic";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Create one account.
 *
 * The roles offered are the five a campus IT administrator may assign, and the
 * list is short for a reason that is not cosmetic: `superadmin` is Odenta's own
 * account, it spans every tenant, and the server refuses it outright. Leaving
 * it out of the dropdown is the courtesy; the refusal is the control.
 *
 * Two fields change meaning with the role, and getting that wrong is what makes
 * an account useless rather than merely wrong:
 *
 *   reference   a student *number* for a student — the number their transcript
 *               is filed under, and required, because an account that cannot be
 *               matched to a transcript is an account with no purpose. For
 *               staff it is optional and is whatever the faculty files them by.
 *   year/group  only a student has a cohort. Shown for nobody else, because a
 *               clinic-desk account with an academic year is a field somebody
 *               will eventually try to report on.
 */
export default function CreateAccountModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isStudent = form.role === ROLES.UNI_STUDENT;
  const isSupervisor = form.role === ROLES.UNI_SUPERVISOR;

  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [field]: value }));
    /* Clear the message under the field being corrected, not all of them —
       re-showing four errors because one was fixed reads as a broken form. */
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Everything the server will refuse, checked here so the trip is saved. */
  const problems = useMemo(() => {
    const found = {};
    if (!form.name.trim()) found.name = "Enter the person's full name";
    if (!form.email.trim()) found.email = "Enter their email address";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email.trim())) {
      found.email = "That does not look like an email address";
    }
    if (isStudent && !form.reference.trim()) {
      found.reference = "A student number is required — the transcript is filed under it";
    }
    return found;
  }, [form, isStudent]);

  const submit = async (event) => {
    event?.preventDefault?.();

    if (Object.keys(problems).length) {
      setFieldErrors(problems);
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await universityService.createAccount({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        reference: form.reference.trim() || null,
        title: form.title.trim() || null,
        academicYear: isStudent ? form.academicYear || null : null,
        group: isStudent ? form.group.trim() || null : null,
        mfaRequired: form.mfaRequired,
        credentialMode: form.credentialMode,
      });

      setForm(EMPTY);
      /* The parent owns the credential dialog: this one closes, and the value
         it produced is shown by something that outlives it. */
      onCreated?.(result);
    } catch (cause) {
      /**
       * A 422 names its fields, so they go under the inputs. Anything else —
       * an address already taken, a student number in use — is one sentence at
       * the top, because it is about the account rather than about a field.
       */
      if (cause?.details && typeof cause.details === "object") setFieldErrors(cause.details);
      setError(cause?.message ?? "The account could not be created");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    setForm(EMPTY);
    setError(null);
    setFieldErrors({});
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create an account"
      description="One login, plus the person it belongs to. They appear in People and in the cohort lists immediately."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={busy}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Create the account
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={fieldErrors.name}>
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="Yara Hassan"
              autoFocus
            />
          </Field>

          <Field label="Email address" required error={fieldErrors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="yara.hassan@student.aiu.edu.eg"
            />
          </Field>

          <Field label="Role" required error={fieldErrors.role}>
            <Select value={form.role} onChange={set("role")}>
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_META[role]?.label ?? role}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={isStudent ? "Student number" : "Staff reference"}
            required={isStudent}
            error={fieldErrors.reference}
            hint={
              isStudent
                ? "The number the university files their transcript under"
                : "Optional — whatever the faculty files them by"
            }
          >
            <Input
              value={form.reference}
              onChange={set("reference")}
              placeholder={isStudent ? "20261501" : "USTF-11"}
              className="font-mono"
            />
          </Field>

          {isStudent ? (
            <>
              <Field label="Academic year">
                <Select value={form.academicYear} onChange={set("academicYear")}>
                  <option value="">Not set yet</option>
                  {ACADEMIC_YEARS.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Group">
                <Input value={form.group} onChange={set("group")} placeholder="Group A" />
              </Field>
            </>
          ) : (
            <Field
              label="Title"
              className="sm:col-span-2"
              hint={isSupervisor ? "As it appears on a sign-off" : "Shown in the staff directory"}
            >
              <Input
                value={form.title}
                onChange={set("title")}
                placeholder={isSupervisor ? "Lecturer, Operative Dentistry" : "Clinic Desk Lead"}
              />
            </Field>
          )}
        </div>

        {/* ------------------------------------------------- the credential */}

        <fieldset className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-[12px] font-bold uppercase tracking-wide text-ink-soft">
            First sign-in
          </legend>

          <div className="mt-1 grid gap-2.5 sm:grid-cols-2">
            <CredentialChoice
              selected={form.credentialMode === "invite"}
              onSelect={() => setForm((current) => ({ ...current, credentialMode: "invite" }))}
              icon={<Link2 className="h-4 w-4" />}
              title="Send an invitation"
              detail="They set their own password through a single-use link. Nothing secret is stored or displayed."
              recommended
            />
            <CredentialChoice
              selected={form.credentialMode === "temporary"}
              onSelect={() => setForm((current) => ({ ...current, credentialMode: "temporary" }))}
              icon={<KeyRound className="h-4 w-4" />}
              title="Temporary password"
              detail="Shown to you once, to hand over in person. They must change it at first sign-in."
            />
          </div>
        </fieldset>

        {/* `Switch` renders the toggle alone and takes `label` as its
            accessible name, so the visible wording sits beside it. */}
        <div className="flex items-start gap-3">
          <Switch
            checked={form.mfaRequired}
            onChange={(value) => setForm((current) => ({ ...current, mfaRequired: value }))}
            label="Require multi-factor authentication"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-ink">
              Require multi-factor authentication
            </span>
            <span className="block text-[12px] text-ink-muted">
              Sign-in is refused until this account has enrolled.
            </span>
          </span>
        </div>

        {form.mfaRequired ? (
          <InfoBanner tone="warning">
            There is no self-service enrolment yet, so this account cannot sign in until an
            administrator clears the requirement. Use it for staff you will enrol yourself.
          </InfoBanner>
        ) : null}
      </form>
    </Modal>
  );
}

const EMPTY = {
  name: "",
  email: "",
  role: ROLES.UNI_STUDENT,
  reference: "",
  title: "",
  academicYear: "",
  group: "",
  mfaRequired: false,
  /* Invitations are the default: cheaper in bulk, and nothing secret is ever
     displayed, stored or pasted into a spreadsheet. */
  credentialMode: "invite",
};

/**
 * The roles a campus IT administrator may assign.
 *
 * Mirrors the server's list. `superadmin` is absent and its absence is the
 * point — see the note at the top of the file.
 */
const ASSIGNABLE_ROLES = [
  ROLES.UNI_STUDENT,
  ROLES.UNI_SUPERVISOR,
  ROLES.UNI_ASSISTANT,
  ROLES.UNI_ADMIN,
  ROLES.UNI_IT,
];

/** A radio that reads as a decision rather than as a form control. */
function CredentialChoice({ selected, onSelect, icon, title, detail, recommended }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "od-focus flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-colors",
        selected
          ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("shrink-0", selected ? "text-brand-600" : "text-ink-soft")}>
          {icon}
        </span>
        <span className="text-[13px] font-bold text-ink">{title}</span>
        {recommended ? (
          <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-success-ink">
            Safer
          </span>
        ) : null}
      </span>
      <span className="text-[12px] leading-snug text-ink-muted">{detail}</span>
    </button>
  );
}
