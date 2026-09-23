import { useMemo, useState } from "react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { formatEgp } from "./platformFormat";

/**
 * Sign a university or a partner clinic.
 *
 * One field on this form is unlike every other field in the product, and the
 * form says so rather than leaving it to be discovered: **the tenant id becomes
 * a partition key**. It is the first level of the key on five Cosmos
 * containers, so it decides where every one of that tenant's documents
 * physically lives — it cannot be changed afterwards, and a space or a slash in
 * it would turn every query that tenant ever makes into a debugging session.
 *
 * So it is suggested from the name, constrained to the shape the server
 * accepts, and labelled as permanent. The server validates the same regex; this
 * is the affordance, not the guard.
 */
export default function TenantFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    kind: "campus",
    name: "",
    shortName: "",
    tenantId: "",
    city: "",
    plan: "trial",
    notes: "",
  });
  const [touchedId, setTouchedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { data: plans = [] } = useAsync(() => platformService.getPlans(), [], []);

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((current) => {
      const next = { ...current, [key]: value };

      /**
       * Suggest the id from the name until somebody edits it.
       *
       * Once they have, it stays theirs — an id that kept rewriting itself
       * while you typed a name would be worse than no suggestion, because the
       * value it lands on is the one that becomes permanent.
       */
      if (key === "name" && !touchedId) next.tenantId = suggestId(value, current.kind);
      if (key === "kind" && !touchedId) next.tenantId = suggestId(current.name, value);
      /* A plan is offered per kind, so switching kind can invalidate it. */
      if (key === "kind") next.plan = "trial";
      return next;
    });
  };

  const available = useMemo(
    () => plans.filter((plan) => plan.kind?.includes(form.kind)),
    [plans, form.kind]
  );

  const selectedPlan = available.find((plan) => plan.key === form.plan);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        kind: form.kind,
        name: form.name.trim(),
        shortName: form.shortName.trim() || undefined,
        tenantId: form.tenantId.trim().toUpperCase(),
        city: form.city.trim() || undefined,
        plan: form.plan,
        notes: form.notes.trim() || undefined,
      });
    } catch (cause) {
      /* The server's field errors are rendered against the inputs; anything
         else becomes the banner. */
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key) => error?.details?.[key];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign a tenant"
      description="A university runs the teaching-clinic portal; a partner clinic runs the practice portal."
      size="lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && !error.details ? (
          <InfoBanner tone="danger">{error.message}</InfoBanner>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind" required>
            <Select value={form.kind} onChange={set("kind")}>
              <option value="campus">University campus</option>
              <option value="clinic">Partner clinic</option>
            </Select>
          </Field>

          <Field label="Plan" required hint={selectedPlan ? `${formatEgp(selectedPlan.priceEgp)} per month` : undefined}>
            <Select value={form.plan} onChange={set("plan")}>
              {available.map((plan) => (
                <option key={plan.key} value={plan.key}>
                  {plan.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Legal name" required error={fieldError("name")}>
          <Input
            value={form.name}
            onChange={set("name")}
            placeholder="Alamein International University"
            maxLength={160}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Short name" hint="Shown on charts and tiles">
            <Input value={form.shortName} onChange={set("shortName")} placeholder="AIU" maxLength={24} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={set("city")} placeholder="New Alamein" maxLength={80} />
          </Field>
        </div>

        <Field
          label="Tenant id"
          required
          error={fieldError("tenantId")}
          hint="Permanent. This becomes the partition key on every one of this tenant's records and cannot be changed later."
        >
          <Input
            value={form.tenantId}
            onChange={(event) => {
              setTouchedId(true);
              setForm((current) => ({
                ...current,
                tenantId: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
              }));
            }}
            placeholder="UNI-04"
            maxLength={32}
            className="font-mono"
          />
        </Field>

        {selectedPlan ? (
          <InfoBanner tone="info">
            {selectedPlan.label} includes {selectedPlan.seats.toLocaleString()} seats and{" "}
            {selectedPlan.storageGb.toLocaleString()} GB of imaging. Going over either is reported on
            the tenant, never blocked.
          </InfoBanner>
        ) : null}

        <Field label="Notes" hint="Contract context a colleague would need on a support call">
          <Textarea value={form.notes} onChange={set("notes")} rows={3} maxLength={2000} />
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!form.name.trim() || form.tenantId.length < 3}>
            Sign tenant
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * `Alamein International University` → `AIU-01`.
 *
 * Initials of the first three significant words, which is how these are
 * actually referred to out loud. The `-01` is a placeholder the operator
 * corrects — guessing a sequence number would need a round trip to be right and
 * would still race with a second operator signing a tenant in the same minute.
 */
function suggestId(name, kind) {
  const initials = String(name ?? "")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (!initials) return kind === "campus" ? "UNI-" : "CLN-";
  return `${initials}-01`;
}
