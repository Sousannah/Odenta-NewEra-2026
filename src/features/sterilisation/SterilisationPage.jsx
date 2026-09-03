import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Plus, ShieldCheck } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicalService, inventoryService } from "@/services";
import { formatDate } from "@/lib/format";
import {
  CYCLE_RESULTS,
  SPORE_TEST_INTERVAL_DAYS,
  STERILIZER_CYCLE_TYPES,
} from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { PageHeader, StatCard, toneFor, labelFor } from "@/components/shared";

function CycleModal({ open, onClose, sterilizers, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    sterilizerId: "",
    type: "B",
    load: "",
    chemicalIndicator: "pass",
    biologicalIndicator: "",
    temperature: 134,
    holdMinutes: 4,
    operator: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await clinicalService.logSterilizationCycle({
        ...form,
        sterilizerId: form.sterilizerId || sterilizers[0]?.id,
        cycleNumber: Math.floor(Math.random() * 1000) + 8800,
        result: form.chemicalIndicator === "fail" ? "fail" : "pending",
        biologicalIndicator: form.biologicalIndicator || null,
      });
      toast.success("Cycle recorded", "Result will update once the indicator is read");
      onSaved?.();
      onClose();
    } catch (cause) {
      toast.error("Could not record cycle", cause.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a sterilisation cycle"
      description="Every load must be traceable to a cycle, an operator and an indicator result."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button className="min-w-[140px]" loading={saving} disabled={!form.load} onClick={save}>
            Record cycle
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sterilizer" required>
            <Select
              value={form.sterilizerId}
              onChange={(event) => update({ sterilizerId: event.target.value })}
            >
              {sterilizers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.series}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cycle class">
            <Select value={form.type} onChange={(event) => update({ type: event.target.value })}>
              {STERILIZER_CYCLE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} — {item.detail}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Load contents" required>
          <Input
            placeholder="Surgical kits ×4, handpieces ×6"
            value={form.load}
            onChange={(event) => update({ load: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Temperature (°C)">
            <Input
              type="number"
              value={form.temperature}
              onChange={(event) => update({ temperature: Number(event.target.value) })}
            />
          </Field>
          <Field label="Hold time (min)">
            <Input
              type="number"
              value={form.holdMinutes}
              onChange={(event) => update({ holdMinutes: Number(event.target.value) })}
            />
          </Field>
          <Field label="Operator">
            <Input
              placeholder="Your name"
              value={form.operator}
              onChange={(event) => update({ operator: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chemical indicator">
            <Select
              value={form.chemicalIndicator}
              onChange={(event) => update({ chemicalIndicator: event.target.value })}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </Select>
          </Field>
          <Field label="Biological (spore) test" hint="leave blank if not run">
            <Select
              value={form.biologicalIndicator}
              onChange={(event) => update({ biologicalIndicator: event.target.value })}
            >
              <option value="">Not run this cycle</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            rows={2}
            placeholder="Anything unusual about this load"
            value={form.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}

/**
 * Infection control log.
 *
 * Regulators ask two questions: can you show every load was processed, and
 * can you show the weekly biological test passed. This screen answers both.
 */
export default function SterilisationPage() {
  const { can } = useAuth();
  const form = useDisclosure();

  const { data: cycles = [], loading, refetch } = useAsync(
    () => clinicalService.getSterilizationCycles(),
    [],
    []
  );
  const { data: peripherals = [] } = useAsync(
    () => inventoryService.getPeripherals(),
    [],
    []
  );

  const sterilizers = peripherals.filter((item) => item.category === "Sterilization");
  const lastSpore = cycles.find((cycle) => cycle.biologicalIndicator);
  const sporeAge = lastSpore
    ? differenceInCalendarDays(new Date(), new Date(lastSpore.startedAt))
    : null;
  const sporeOverdue = sporeAge != null && sporeAge > SPORE_TEST_INTERVAL_DAYS;

  const columns = [
    {
      key: "cycleNumber",
      header: "Cycle",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-ink">#{row.cycleNumber}</span>
          <span className="block text-[12px] text-ink-soft">Class {row.type}</span>
        </span>
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      sortable: true,
      render: (row) => formatDate(row.startedAt, "d MMM yyyy · HH:mm"),
    },
    { key: "load", header: "Load" },
    { key: "operator", header: "Operator" },
    {
      key: "parameters",
      header: "Parameters",
      render: (row) => `${row.temperature} °C · ${row.holdMinutes} min`,
    },
    {
      key: "chemicalIndicator",
      header: "Chemical",
      align: "center",
      render: (row) => <Badge tone={toneFor(row.chemicalIndicator)}>{labelFor(row.chemicalIndicator)}</Badge>,
    },
    {
      key: "biologicalIndicator",
      header: "Biological",
      align: "center",
      render: (row) =>
        row.biologicalIndicator ? (
          <Badge tone={toneFor(row.biologicalIndicator)}>{labelFor(row.biologicalIndicator)}</Badge>
        ) : (
          <span className="text-[12px] text-ink-faint">—</span>
        ),
    },
    {
      key: "result",
      header: "Result",
      sortable: true,
      render: (row) => <Badge tone={toneFor(row.result)}>{labelFor(row.result)}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Sterilisation"
        description="Cycle-level traceability for every instrument load."
        actions={
          can(P.STERILIZATION_LOG) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
              Record cycle
            </Button>
          ) : null
        }
      />

      {sporeOverdue ? (
        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          The last biological (spore) test was {sporeAge} days ago — the interval is{" "}
          {SPORE_TEST_INTERVAL_DAYS} days. Run one on the next load.
        </InfoBanner>
      ) : null}

      {cycles.some((cycle) => cycle.result === "fail") ? (
        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          A failed cycle is on record. Any load from a failed cycle must be reprocessed before use —
          check the notes column.
        </InfoBanner>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Cycles logged"
          value={cycles.length}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting result"
          value={cycles.filter((cycle) => cycle.result === "pending").length}
          tone="warning"
        />
        <StatCard
          label="Failed"
          value={cycles.filter((cycle) => cycle.result === "fail").length}
          tone="danger"
        />
        <StatCard
          label="Last spore test"
          value={lastSpore ? `${sporeAge} d ago` : "Never"}
          tone={sporeOverdue ? "danger" : "success"}
        />
      </div>

      <DataTable
        columns={columns}
        rows={cycles}
        loading={loading}
        emptyTitle="No cycles recorded"
        emptyDescription="Record the first load of the day to start the log."
      />

      <div className="od-card p-5">
        <h3 className="text-[15px] font-bold text-ink">Cycle classes</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {STERILIZER_CYCLE_TYPES.map((item) => (
            <li key={item.value} className="rounded-xl border border-slate-200 px-3.5 py-3">
              <span className="block text-[13px] font-bold text-ink">{item.label}</span>
              <span className="mt-0.5 block text-[12px] text-ink-soft">{item.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-ink-soft">
          Results: {CYCLE_RESULTS.map((item) => item.label).join(" · ")}. A load may only be
          released once its chemical indicator has passed.
        </p>
      </div>

      <CycleModal
        open={form.isOpen}
        onClose={form.close}
        sterilizers={sterilizers}
        onSaved={refetch}
      />
    </div>
  );
}
