import { useEffect, useState } from "react";
import { Lock, Plus, Shield, Trash2 } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { ROLE_META } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";

/**
 * The role matrix.
 *
 * ## Built-in roles are code, not data
 *
 * The ten roles are wired into navigation, two route guards and two permission
 * catalogues. Making them editable would be a settings screen capable of
 * locking every user out of the product, so they are shown here read-only —
 * which is still worth doing, because "what can a supervisor actually do" is a
 * question that otherwise gets answered by reading source.
 *
 * ## A custom role can only ever narrow
 *
 * A custom role names a built-in it is `basedOn`, and its permissions are
 * intersected with that role's grant *on the server* at the point of save. That
 * single property is what makes this feature safe to ship: no combination of
 * rows anyone can create produces a login with more access than a built-in role
 * already has. Ticking a box outside the base role's grant is silently dropped
 * and reported back, so the screen can say why it did not stick.
 *
 * The cases this exists for are already visible: a read-only auditor for an
 * accreditation visit, a support engineer who sees tenants and no patients, a
 * finance operator who sees only billing.
 */
export default function RolesPage() {
  const toast = useToast();
  const editor = useDisclosure();
  const [query, setQuery] = useState("");

  const { data, loading, refetch } = useAsync(() => platformService.getRoles(), []);

  const remove = async (role) => {
    try {
      await platformService.deleteRole(role.roleKey);
      toast.success("Role removed", role.label);
      refetch();
    } catch (error) {
      toast.error("Could not remove that role", error.message);
    }
  };

  if (loading && !data) {
    return <OdentaLoaderPanel />;
  }

  const search = query.trim().toLowerCase();
  const matches = (permission) => !search || permission.toLowerCase().includes(search);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Roles"
        description="The ten built-in roles are defined in code and shown here read-only. A custom role is a named subset of one of them — it can narrow, never widen."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => editor.open(null)}>
            New custom role
          </Button>
        }
      />

      <InfoBanner tone="info" icon={<Lock className="h-4 w-4" />}>
        A custom role's permissions are intersected with its base role on the server. Anything
        outside that grant is dropped — so nothing you can save here can give an account more access
        than a built-in role already has.
      </InfoBanner>

      {/* ------------------------------------------------------- custom roles */}
      {data?.custom?.length ? (
        <Card>
          <CardHeader title="Custom roles" subtitle="Defined here, enforced on the server" />
          <CardBody className="pt-2">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.custom.map((role) => (
                <div key={role.roleKey} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block truncate text-[13.5px] font-extrabold text-ink">
                        {role.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11.5px] text-ink-faint">
                        {role.roleKey}
                      </span>
                    </div>
                    <Badge tone={role.status === "active" ? "success" : "neutral"}>{role.status}</Badge>
                  </div>

                  {role.description ? (
                    <p className="mt-2 text-[12px] text-ink-soft">{role.description}</p>
                  ) : null}

                  <p className="mt-3 text-[12px] text-ink-muted">
                    Based on <span className="font-semibold">{ROLE_META[role.basedOn]?.label ?? role.basedOn}</span>{" "}
                    · {role.permissions?.length ?? 0} permissions
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" size="xs" onClick={() => editor.open(role)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-danger"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => remove(role)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* ------------------------------------------------------ the built-ins */}
      <Card>
        <CardHeader
          title="Built-in roles"
          subtitle="Defined in code so the client and the server cannot disagree about them"
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter permissions…"
              className="w-full sm:w-[260px]"
            />
          }
        />
        <CardBody className="pt-2">
          <div className="flex flex-col gap-3">
            {(data?.builtIn ?? []).map((role) => {
              const shown = role.permissions.filter(matches);
              if (search && !shown.length) return null;

              return (
                <details
                  key={role.key}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  open={Boolean(search)}
                >
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2.5">
                    <Shield className="h-4 w-4 text-ink-faint" />
                    <span className="text-[13.5px] font-extrabold text-ink">{role.label}</span>
                    <Badge tone={ROLE_META[role.key]?.tone ?? "neutral"}>{role.key}</Badge>
                    {role.portal ? <Badge tone="outline">{role.portal}</Badge> : null}
                    <span className="ml-auto text-[12px] text-ink-soft">
                      {shown.length}
                      {search ? ` of ${role.permissions.length}` : ""} permissions
                    </span>
                  </summary>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {shown.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-ink-muted"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <RoleEditor
        open={editor.isOpen}
        onClose={editor.close}
        role={editor.payload}
        builtIn={data?.builtIn ?? []}
        onSaved={(result) => {
          toast.success(
            "Role saved",
            result.ignored?.length
              ? `${result.ignored.length} permission${result.ignored.length === 1 ? "" : "s"} dropped — outside the base role`
              : `${result.permissions?.length ?? 0} permissions`
          );
          editor.close();
          refetch();
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- editor */

function RoleEditor({ open, onClose, role, builtIn, onSaved }) {
  const [form, setForm] = useState({ roleKey: "", label: "", description: "", basedOn: "uni_admin" });
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* Re-seed when the dialog opens over a different role. `open` in the
     dependency list is what makes editing two roles in a row work. */
  useEffect(() => {
    if (!open) return;
    setForm({
      roleKey: role?.roleKey ?? "",
      label: role?.label ?? "",
      description: role?.description ?? "",
      basedOn: role?.basedOn ?? "uni_admin",
    });
    setSelected(new Set(role?.permissions ?? []));
    setError(null);
  }, [open, role]);

  /**
   * The picker only offers what the base role actually holds.
   *
   * The server would drop anything else anyway, so offering it would be a
   * checkbox that un-ticks itself on save — the most confusing possible way to
   * communicate the rule.
   */
  const available = builtIn.find((entry) => entry.key === form.basedOn)?.permissions ?? [];

  const toggle = (permission) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await platformService.saveRole(form.roleKey.trim(), {
        label: form.label.trim(),
        description: form.description.trim() || undefined,
        basedOn: form.basedOn,
        permissions: [...selected].filter((permission) => available.includes(permission)),
        status: "active",
      });
      onSaved?.(result);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role ? `Edit ${role.label}` : "New custom role"}
      description="Pick a base role, then take capabilities away from it."
      size="lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={error?.details?.label}>
            <Input
              value={form.label}
              onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))}
              maxLength={80}
              placeholder="Accreditation auditor"
            />
          </Field>

          <Field
            label="Key"
            required
            error={error?.details?.roleKey}
            hint="Permanent. Lowercase letters, digits and underscores."
          >
            <Input
              value={form.roleKey}
              onChange={(event) =>
                setForm((c) => ({
                  ...c,
                  roleKey: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                }))
              }
              maxLength={48}
              disabled={Boolean(role)}
              className="font-mono"
              placeholder="accreditation_auditor"
            />
          </Field>
        </div>

        <Field label="Based on" required hint="This role can hold a subset of the base role, never more.">
          <Select
            value={form.basedOn}
            onChange={(event) => {
              const basedOn = event.target.value;
              setForm((c) => ({ ...c, basedOn }));
              /* Drop anything the new base does not hold, rather than leaving
                 ticks that would silently vanish at save. */
              const next = builtIn.find((entry) => entry.key === basedOn)?.permissions ?? [];
              setSelected((current) => new Set([...current].filter((p) => next.includes(p))));
            }}
          >
            {builtIn.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label} — {entry.permissions.length} permissions
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
            rows={2}
            maxLength={400}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between">
            <span className="od-label">Permissions ({selected.size} of {available.length})</span>
            <div className="flex gap-2">
              <Button type="button" variant="link" size="xs" onClick={() => setSelected(new Set(available))}>
                All
              </Button>
              <Button type="button" variant="link" size="xs" onClick={() => setSelected(new Set())}>
                None
              </Button>
            </div>
          </div>

          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-3">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {available.map((permission) => (
                <Checkbox
                  key={permission}
                  checked={selected.has(permission)}
                  onChange={() => toggle(permission)}
                  label={<span className="font-mono text-[11.5px]">{permission}</span>}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!form.label.trim() || !form.roleKey || !selected.size}>
            Save role
          </Button>
        </div>
      </form>
    </Modal>
  );
}
