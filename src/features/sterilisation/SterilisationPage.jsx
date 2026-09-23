import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Hourglass, Microscope, Plus, ShieldCheck } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { assistantService } from "@/services";
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
import { PageHeader, StatCard, StatGrid, toneFor, labelFor } from "@/components/shared";

function CycleModal({ open, onClose, sterilizers, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    sterilizerId: "",
    type: "B",
    load: "",
    chemicalIndicator: "pass",
    biologicalIndicator: "",
    /**
     * Whether this load carries a spore test.
     *
     * The flag that decides what an unread biological indicator *means*.
     * Without it either every routine load sits pending forever, or a spore
     * test reports a pass before the incubator has been read — and the second
     * is the one that matters, because it is a claim the steriliser works that
     * nobody has checked.
     */
    sporeTest: false,
    temperature: 134,
    holdMinutes: 4,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      /**
       * Two fields are deliberately *not* sent any more.
       *
       * `cycleNumber` used to be `Math.floor(Math.random() * 1000) + 8800`. A
       * register numbered at random has duplicates and gaps, and "cycle 8814"
       * is the identifier a load of instruments is traced back by — so a
       * collision means two loads share an identity and neither can be cleared
       * or recalled independently. The server issues it from a per-clinic
       * atomic sequence.
       *
       * `result` used to be decided here as `chemical === "fail" ? "fail" :
       * "pending"`, which left every ordinary passing load sitting pending
       * forever and made the "awaiting result" tile meaningless. The server
       * derives it: a chemical indicator releases a routine load, and only a
       * spore-test load waits on the incubator.
       */
      const created = await assistantService.logCycle({
        sterilizerId: form.sterilizerId || sterilizers[0]?.id,
        type: form.type,
        load: form.load,
        chemicalIndicator: form.chemicalIndicator || null,
        biologicalIndicator: form.biologicalIndicator || null,
        sporeTest: form.sporeTest,
        temperature: form.temperature,
        holdMinutes: form.holdMinutes,
        notes: form.notes,
      });

      toast.success(
        `Cycle ${created?.cycleNumber ?? ""} recorded`.trim(),
        created?.result === "pending"
          ? "Waiting on the incubator — record the reading when it comes back"
          : `Result: ${created?.result ?? "recorded"}`
      );
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
          {/**
           * The operator field is gone on purpose.
           *
           * It used to be a free-text box the person filled in themselves, which
           * means a sign-off in a legal register attributable to whatever was
           * typed. The server stamps it from the session instead — a signature
           * the client can set is a signature anyone can forge.
           */}
          <Field label="Spore test" hint="does this load carry a biological indicator?">
            <Select
              value={form.sporeTest ? "yes" : "no"}
              onChange={(event) => update({ sporeTest: event.target.value === "yes" })}
            >
              <option value="no">Routine load</option>
              <option value="yes">Weekly spore test</option>
            </Select>
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
    () => assistantService.getCycles(),
    [],
    []
  );

  /**
   * The tile strip and the spore warning, folded server-side.
   *
   * Counted here before, which meant the screen had to hold the whole register
   * to produce four numbers — and the sterilisation register is the one table
   * in a practice that is never pruned, because it is a legal record. The list
   * below is now a capped recent page, so counting it would be wrong as well as
   * expensive.
   */
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => assistantService.getSterilisationSummary(),
    [],
    null
  );

  /**
   * The autoclaves, from the sterilisation surface rather than the equipment
   * register.
   *
   * `/inventory/peripherals` is gated on `peripheral:view`, which a **dentist
   * does not hold** — and a dentist can open this page, because they hold
   * `sterilization:view`. Pointing the dropdown at the register 403'd for
   * exactly the role most likely to be reading a cycle result, and blanked the
   * page. This endpoint serves the four fields the dropdown needs under the
   * permission that already gates the screen; purchase price, invoice number
   * and service contract stay behind `peripheral:view`, which is what that
   * permission is actually protecting.
   */
  const { data: sterilizers = [] } = useAsync(() => assistantService.getSterilizers(), [], []);

  const spore = summary?.spore ?? {};
  const sporeAge = spore.lastAt
    ? differenceInCalendarDays(new Date(), new Date(spore.lastAt))
    : null;
  const sporeOverdue = Boolean(spore.due);

  const reload = () => {
    refetch();
    refetchSummary();
  };

  const columns = [
    {
      key: "cycleNumber",
      header: "Cycle",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-ink">#{row.cycleNumber}</span>
          <span className="block text-[12px] text-ink-soft">
            Class {row.type ?? "—"}
            {row.sporeTest ? " · spore test" : ""}
          </span>
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
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
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
        <InfoBanner tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
          {spore.lastAt
            ? `The last passing biological (spore) test was ${sporeAge} days ago — the interval is ${spore.intervalDays ?? SPORE_TEST_INTERVAL_DAYS} days. Run one on the next load.`
            : "No passing spore test is on file. The steriliser has no evidence it is working — run one today."}
        </InfoBanner>
      ) : null}

      {/* Counted server-side: the page below is a capped recent window, so a
          failure older than it would otherwise stop being mentioned. */}
      {(summary?.failed ?? 0) > 0 ? (
        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          {summary.failed} failed {summary.failed === 1 ? "cycle is" : "cycles are"} on record. Any
          load from a failed cycle must be reprocessed before use — check the notes column.
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Cycles logged"
          value={summary?.total ?? 0}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting result" value={summary?.pending ?? 0} tone="warning"
          icon={<Hourglass className="h-5 w-5" />}
        />
        <StatCard
          label="Failed" value={summary?.failed ?? 0} tone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Last spore test" value={spore.lastAt ? `${sporeAge} d ago` : "Never"} tone={sporeOverdue ? "danger" : "success"}
          icon={<Microscope className="h-5 w-5" />}
        />
      </StatGrid>

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
        onSaved={reload}
      />
    </div>
  );
}
