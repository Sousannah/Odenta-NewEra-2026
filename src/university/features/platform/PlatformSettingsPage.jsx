import { useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { formatDate } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Switch } from "@/components/ui/Field";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";

/**
 * What the platform is configured to do.
 *
 * ## Settings are typed, and the type lives on the server
 *
 * The catalogue on the server is the authority for what a setting is — its
 * type, its bounds and what it means — and a key that is not in it cannot be
 * written. Without that this becomes an untyped key-value store nobody can
 * safely delete from, because no one can tell which rows anything still reads.
 *
 * So this screen renders whatever the server describes, in whatever control its
 * declared type calls for. Adding a setting is one entry in one object on the
 * server and no change here at all.
 *
 * ## Defaults are visible
 *
 * A setting that has never been overridden says so, and can be put back. That
 * matters more than it sounds: the most common question about a settings screen
 * six months in is "was this deliberate or has it always been like that", and a
 * stored row that happens to equal the default cannot answer it.
 */

/** Settings are grouped by the prefix on their key, which the server already
    uses as a namespace — so a new group appears without an edit here. */
const GROUP_LABELS = {
  signups: "Sign-ups",
  maintenance: "Maintenance",
  security: "Security",
  billing: "Billing",
  limits: "Limits",
  retention: "Retention",
  support: "Support",
};

export default function PlatformSettingsPage() {
  const toast = useToast();
  const { data: settings = [], loading, refetch } = useAsync(() => platformService.getSettings(), [], []);
  const [pending, setPending] = useState(null);

  const save = async (setting, value) => {
    setPending(setting.key);
    try {
      await platformService.setSetting(setting.key, value);
      toast.success("Saved", setting.label);
      refetch();
    } catch (error) {
      toast.error("Could not save that setting", error.message);
      refetch();
    } finally {
      setPending(null);
    }
  };

  const reset = async (setting) => {
    setPending(setting.key);
    try {
      await platformService.resetSetting(setting.key);
      toast.success("Back to its built-in value", setting.label);
      refetch();
    } catch (error) {
      toast.error("Could not reset that setting", error.message);
    } finally {
      setPending(null);
    }
  };

  if (loading && !settings.length) {
    return <OdentaLoaderPanel />;
  }

  const groups = settings.reduce((acc, setting) => {
    const group = setting.key.split(".")[0];
    acc[group] = [...(acc[group] ?? []), setting];
    return acc;
  }, {});

  const maintenance = settings.find((entry) => entry.key === "maintenance.enabled");

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Platform settings"
        description="Every change here is recorded in the audit trail and raised as a security event. A setting that has never been overridden says so, and can be put back."
      />

      {maintenance?.value ? (
        <InfoBanner tone="danger">
          Maintenance mode is on. Tenants are being shown the maintenance banner rather than the
          product.
        </InfoBanner>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {Object.entries(groups).map(([group, entries]) => (
          <Card key={group}>
            <CardHeader
              title={GROUP_LABELS[group] ?? group}
              subtitle={`${entries.length} ${entries.length === 1 ? "setting" : "settings"}`}
            />
            <CardBody className="flex flex-col gap-4 pt-2">
              {entries.map((setting) => (
                <SettingRow
                  key={setting.key}
                  setting={setting}
                  busy={pending === setting.key}
                  onSave={(value) => save(setting, value)}
                  onReset={() => reset(setting)}
                />
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingRow({ setting, busy, onSave, onReset }) {
  const [draft, setDraft] = useState(setting.value);
  const dirty = JSON.stringify(draft) !== JSON.stringify(setting.value);

  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-[13px] font-bold text-ink">{setting.label}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">{setting.key}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {setting.isDefault ? (
            <Badge tone="outline">default</Badge>
          ) : (
            <Badge tone="brand">overridden</Badge>
          )}
          {!setting.isDefault ? (
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={onReset}
              loading={busy}
              aria-label={`Reset ${setting.label}`}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        {setting.type === "boolean" ? (
          /* A switch saves immediately — there is nothing to review, and a
             "save" button next to a toggle is a second click for no decision. */
          <Switch
            checked={Boolean(setting.value)}
            onChange={(value) => onSave(value)}
            disabled={busy}
            label={setting.value ? "On" : "Off"}
          />
        ) : setting.type === "stringArray" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={Array.isArray(draft) ? draft.join(", ") : ""}
              onChange={(event) =>
                setDraft(
                  event.target.value
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Comma separated"
              className="flex-1"
            />
            {dirty ? (
              <Button size="sm" loading={busy} onClick={() => onSave(draft)}>
                Save
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type={setting.type === "number" ? "number" : "text"}
              min={setting.min}
              max={setting.max}
              value={draft ?? ""}
              onChange={(event) =>
                setDraft(setting.type === "number" ? Number(event.target.value) : event.target.value)
              }
              className="flex-1"
              /* A webhook URL is a capability, so it is not spell-checked,
                 autocompleted or offered to a password manager. */
              autoComplete={setting.key.includes("Webhook") ? "off" : undefined}
              spellCheck={false}
            />
            {dirty ? (
              <Button size="sm" loading={busy} onClick={() => onSave(draft)}>
                Save
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {setting.min !== undefined || setting.max !== undefined ? (
        <p className="mt-2 text-[11.5px] text-ink-faint">
          Between {setting.min} and {setting.max}.
        </p>
      ) : null}

      {setting.updatedAt ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
          <SlidersHorizontal className="h-3 w-3" />
          Changed {formatDate(setting.updatedAt, "d MMM yyyy")}
        </p>
      ) : null}
    </div>
  );
}
