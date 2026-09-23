import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { platformService } from "@/services";
import { ROLES, ROLE_META, ROLE_ORDER } from "@/auth/roles";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Create a login, and issue the one credential that gets the person in.
 *
 * ## What this used to do, and why it was wrong
 *
 * There was no password field and no credential in the response. The account
 * was created with a hash of random bytes that were immediately discarded, so
 * it existed and could never be signed into, and this dialog said the
 * credential was "issued out of band".
 *
 * The reasoning was sound: an endpoint that can set somebody else's password is
 * an endpoint that can *become* them, and a platform operator holding that is a
 * single compromised laptop away from being every user in the product.
 *
 * But there was no out of band. No invitation mail, no self-service reset, and
 * the Reset button flags an account without minting anything. So every account
 * this console created was **permanently unusable**, and the only symptom was a
 * person telling you they could not log in.
 *
 * ## How the property is kept
 *
 * **Invitation** is the default, and under it the operator still never learns a
 * password: the account is stored with no password hash at all, and what comes
 * back is a single-use link the person redeems at `/activate` to choose their
 * own. The promise "passwords are never shown here" stays literally true.
 *
 * **Temporary password** is offered because standing up a tenant sometimes
 * means handing a login over on a phone call. It forces a reset at first
 * sign-in, so the shared secret does not outlive the call.
 *
 * Either way the value is shown exactly once, by `CredentialModal` — the server
 * kept only a hash and genuinely cannot show it again.
 */
export default function AccountFormModal({ open, onClose, tenants = [], onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: ROLES.UNI_STUDENT,
    tenantId: "",
    staffId: "",
    title: "",
    userId: "",
    mfa: false,
    credentialMode: "invite",
  });
  const [confirmSuperadmin, setConfirmSuperadmin] = useState(false);
  const [touchedUserId, setTouchedUserId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) return;
    setConfirmSuperadmin(false);
    setTouchedUserId(false);
    setError(null);
  }, [open]);

  const isPlatformRole = form.role === ROLES.SUPERADMIN;

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "email" && !touchedUserId) next.userId = suggestUserId(value, current.role);
      if (key === "role" && !touchedUserId) next.userId = suggestUserId(current.email, value);
      /* The founders' account belongs to no tenant, so clear it rather than
         sending a campus the server would have to refuse. */
      if (key === "role" && value === ROLES.SUPERADMIN) next.tenantId = "";
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const account = await platformService.createAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        tenantId: isPlatformRole ? null : form.tenantId,
        staffId: form.staffId.trim() || null,
        title: form.title.trim() || undefined,
        userId: form.userId.trim().toUpperCase(),
        mfa: form.mfa,
        credentialMode: form.credentialMode,
        confirmSuperadmin,
      });
      /* The whole `{ account, credential }`, because the credential has to
         reach `CredentialModal` and this is its only chance to. */
      onCreated?.(account);
      setForm((current) => ({ ...current, name: "", email: "", staffId: "", userId: "" }));
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key) => error?.details?.[key];
  const ready =
    form.name.trim().length > 1 &&
    form.email.includes("@") &&
    form.userId.trim().length > 2 &&
    (isPlatformRole ? confirmSuperadmin : Boolean(form.tenantId));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create an account"
      description="You will be shown one credential to pass on. It cannot be shown again."
      size="lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && !error.details ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={fieldError("name")}>
            <Input value={form.name} onChange={set("name")} maxLength={160} placeholder="Yara Fouad" />
          </Field>
          <Field label="Email" required error={fieldError("email")}>
            <Input
              type="email"
              value={form.email}
              onChange={set("email")}
              maxLength={200}
              placeholder="yara.fouad@aiu.edu.eg"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" required error={fieldError("role")}>
            <Select value={form.role} onChange={set("role")}>
              {ROLE_ORDER.map((value) => (
                <option key={value} value={value}>
                  {ROLE_META[value].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Tenant"
            required={!isPlatformRole}
            error={fieldError("tenantId")}
            hint={isPlatformRole ? "A platform account belongs to no tenant." : undefined}
          >
            <Select value={form.tenantId} onChange={set("tenantId")} disabled={isPlatformRole}>
              <option value="">{isPlatformRole ? "Platform" : "Choose a tenant…"}</option>
              {tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/**
         * Creating another account that can do everything is the single most
         * consequential thing this console does, so it needs a second,
         * deliberate act — and the server refuses without the flag regardless
         * of what this form does.
         */}
        {isPlatformRole ? (
          <InfoBanner tone="danger" icon={<ShieldAlert className="h-4 w-4" />}>
            <div className="flex flex-col gap-2">
              <span>
                A Super Admin account can read every tenant's numbers, deactivate any login and
                change what the platform is allowed to do. Creating one is recorded as a critical
                security event.
              </span>
              <Switch
                checked={confirmSuperadmin}
                onChange={setConfirmSuperadmin}
                label="I mean to create another platform account"
              />
            </div>
          </InfoBanner>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="User id"
            required
            error={fieldError("userId")}
            hint="Permanent. How this account is addressed everywhere in the platform."
          >
            <Input
              value={form.userId}
              onChange={(event) => {
                setTouchedUserId(true);
                setForm((current) => ({
                  ...current,
                  userId: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                }));
              }}
              maxLength={64}
              className="font-mono"
              placeholder="UNI-USR-S042"
            />
          </Field>

          <Field
            label="Teaching id"
            hint="STU-001, SUP-01 — the identity their clinical record is scoped by."
          >
            <Input value={form.staffId} onChange={set("staffId")} maxLength={64} className="font-mono" />
          </Field>
        </div>

        <Field label="Title" hint="Shown on their profile and next to anything they sign">
          <Input
            value={form.title}
            onChange={set("title")}
            maxLength={120}
            placeholder="Lecturer in Endodontics"
          />
        </Field>

        <Field label="How they get in" hint="Shown once, on the next screen.">
          <Select
            value={form.credentialMode}
            onChange={(event) =>
              setForm((current) => ({ ...current, credentialMode: event.target.value }))
            }
          >
            <option value="invite">Invitation link — they choose their own password</option>
            <option value="temporary">Temporary password — you hand it over</option>
          </Select>
        </Field>

        <div className="rounded-xl border border-slate-200 p-3.5">
          <Switch
            checked={form.mfa}
            onChange={(value) => setForm((current) => ({ ...current, mfa: value }))}
            label="Require a second factor"
          />
        </div>

        <InfoBanner tone={form.credentialMode === "invite" ? "info" : "warning"}>
          {form.credentialMode === "invite"
            ? "No password is stored and none is shown to you. The link is single-use and expires in 14 days; the person sets their own password when they open it."
            : "You will see this password once. It must be changed at first sign-in, and it is stored only as a hash — nobody can read it back, including you."}
        </InfoBanner>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!ready}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** `yara.fouad@aiu.edu.eg` as a student → `AIU-S-YARAFOUAD`. A starting point. */
function suggestUserId(email, role) {
  const [local, domain] = String(email ?? "").split("@");
  if (!local) return "";
  const prefix = (domain ?? "").split(".")[0]?.toUpperCase().slice(0, 4) || "ODE";
  const letter = (ROLE_META[role]?.short ?? role ?? "U")[0]?.toUpperCase() ?? "U";
  return `${prefix}-${letter}-${local.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12)}`;
}
