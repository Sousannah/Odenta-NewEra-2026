import { useEffect, useState } from "react";
import { BadgeCheck, Clock, ListChecks, Plus, RefreshCw, UserRound, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks";
import { clinicService } from "@/services";
import { formatDate } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { Avatar } from "@/components/ui/Avatar";
import { Checkbox, Field, Input, Radio, Select, Switch, Textarea } from "@/components/ui/Field";

const STEPS = [
  { id: 1, label: "Staff Info", icon: <UserRound className="h-5 w-5" /> },
  { id: 2, label: "Assigned Services", icon: <ListChecks className="h-5 w-5" /> },
  { id: 3, label: "Working Hours", icon: <RefreshCw className="h-5 w-5" /> },
  { id: 4, label: "Days Off", icon: <Clock className="h-5 w-5" /> },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SPECIALISTS = [
  { value: "Oral Surgery", suffix: "Sp.BMMF" },
  { value: "Pediatric Dentistry", suffix: "Sp.KGA" },
  { value: "Conservative Dentistry", suffix: "Sp.KG" },
  { value: "Orthodontics", suffix: "Sp.Ort" },
  { value: "Periodontics", suffix: "Sp.Perio" },
  { value: "Prosthodontics", suffix: "Sp.Pros" },
  { value: "Oral Medicine", suffix: "Sp.PM" },
];

const PUBLIC_HOLIDAYS = [
  { id: "H1", name: "Eid Mubarak", from: "2026-03-20", to: "2026-03-24", yearly: true },
  { id: "H2", name: "New Year Holiday", from: "2026-12-23", to: "2027-01-03", yearly: true },
  { id: "H3", name: "Independence Day", from: "2026-08-17", to: "2026-08-17", yearly: true },
];

const EMPTY = {
  type: "FULL-TIME",
  name: "",
  role: "Dentist",
  speciality: "",
  licence: "",
  email: "",
  phone: "",
  address: "",
  chair: "",
  services: [],
  cosmetics: [],
  hours: DAYS.reduce((acc, day) => {
    acc[day] = { on: !["Saturday", "Sunday"].includes(day), from: "09:00", to: "17:00" };
    return acc;
  }, {}),
  holidays: ["H1"],
  daysOff: [],
};

/* ------------------------------------------------------------- step one */

function StepInfo({ form, update, isDentist }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={form.name || "New member"} size="xl" square />
        <div>
          <div className="flex items-center gap-3">
            <button type="button" className="text-[13px] font-bold text-brand-600 hover:text-brand-800">
              Upload Photo
            </button>
            <button type="button" className="text-[13px] font-bold text-danger hover:brightness-95">
              Delete
            </button>
          </div>
          <p className="mt-1 max-w-[280px] text-[11.5px] text-ink-soft">
            An image of the person, it&apos;s best if it has the same length and height
          </p>
        </div>
      </div>

      <Field label="Type">
        <div className="grid grid-cols-2 gap-3">
          {["FULL-TIME", "PART-TIME"].map((option) => (
            <Radio
              key={option}
              name="employment"
              label={option === "FULL-TIME" ? "Full time" : "Part-Time"}
              checked={form.type === option}
              onChange={() => update({ type: option })}
            />
          ))}
        </div>
      </Field>

      <Field label="Name" required>
        <Input value={form.name} onChange={(event) => update({ name: event.target.value })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role">
          <Select value={form.role} onChange={(event) => update({ role: event.target.value })}>
            {/* The lab is an outside supplier, not a member of staff. */}
            {["Dentist", "Dental Assistant", "Receptionist"].map((role) => (
              <option key={role}>{role}</option>
            ))}
          </Select>
        </Field>

        {isDentist ? (
          <Field label="Specialist">
            <Select
              value={form.speciality}
              onChange={(event) => update({ speciality: event.target.value })}
            >
              <option value="">Select specialist doctor</option>
              {SPECIALISTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} — {item.suffix}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Speciality">
            <Input
              placeholder="Chairside assisting"
              value={form.speciality}
              onChange={(event) => update({ speciality: event.target.value })}
            />
          </Field>
        )}
      </div>

      {isDentist ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Licence number" required>
            <Input
              placeholder="DDS-88120"
              value={form.licence}
              onChange={(event) => update({ licence: event.target.value })}
            />
          </Field>
          <Field label="Assigned chair">
            <Select value={form.chair} onChange={(event) => update({ chair: event.target.value })}>
              <option value="">Unassigned</option>
              {["Room 1", "Room 2", "Room 3", "Room 4"].map((room) => (
                <option key={room}>{room}</option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => update({ email: event.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(event) => update({ phone: event.target.value })} />
        </Field>
      </div>

      <Field label="Address" counter={`${form.address.length} / 200`}>
        <Textarea
          rows={2}
          maxLength={200}
          value={form.address}
          onChange={(event) => update({ address: event.target.value })}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------- step two */

function ServiceGroup({ title, options, selected, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <span className="text-[13.5px] font-bold text-ink">{title}</span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-ink-muted">
          {selected.length} Selected
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {options.map((option) => (
          <li key={option} className="px-4 py-2.5">
            <Checkbox
              label={option}
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepServices({ form, update, treatments }) {
  const medical = treatments.filter((item) => item.service !== "cosmetic").map((item) => item.name);
  const cosmetic = treatments.filter((item) => item.service === "cosmetic").map((item) => item.name);

  const toggle = (key, value) =>
    update({
      [key]: form[key].includes(value)
        ? form[key].filter((item) => item !== value)
        : [...form[key], value],
    });

  return (
    <div className="flex flex-col gap-4">
      <ServiceGroup
        title="Cosmetic services"
        options={cosmetic}
        selected={form.cosmetics}
        onToggle={(value) => toggle("cosmetics", value)}
      />
      <ServiceGroup
        title="Treatment service"
        options={medical}
        selected={form.services}
        onToggle={(value) => toggle("services", value)}
      />
    </div>
  );
}

/* ----------------------------------------------------------- step three */

function StepHours({ form, update }) {
  const setDay = (day, patch) =>
    update({ hours: { ...form.hours, [day]: { ...form.hours[day], ...patch } } });

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {DAYS.map((day) => {
        const entry = form.hours[day];
        return (
          <div key={day} className="flex flex-wrap items-center gap-4 py-3.5">
            <span className="flex min-w-[150px] items-center gap-3">
              <Switch
                checked={entry.on}
                onChange={(on) => setDay(day, { on })}
                label={`${day} working`}
              />
              <span className={cn("text-[13.5px] font-bold", entry.on ? "text-ink" : "text-ink-soft")}>
                {day}
              </span>
            </span>

            {entry.on ? (
              <span className="flex flex-1 items-center gap-2.5">
                <span className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="time"
                    value={entry.from}
                    onChange={(event) => setDay(day, { from: event.target.value })}
                    className="h-10 rounded-xl border border-slate-200 pl-8 pr-2 text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                  />
                </span>
                <span className="text-[13px] text-ink-soft">to</span>
                <span className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="time"
                    value={entry.to}
                    onChange={(event) => setDay(day, { to: event.target.value })}
                    className="h-10 rounded-xl border border-slate-200 pl-8 pr-2 text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                  />
                </span>
              </span>
            ) : (
              <span className="flex-1 text-[13px] text-ink-soft">Not working on this day</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ step four */

function AddDayOffCard({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: "", from: "", to: "", yearly: false });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-pop">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-bold text-ink">Add Day Off</span>
        <IconButton label="Cancel" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 text-ink-muted" />
        </IconButton>
      </div>

      <Field label="Day Off Name" className="mt-3">
        <Input
          placeholder="Maternity leave"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </Field>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Field label="Date" className="flex-1">
          <Input
            type="date"
            value={form.from}
            onChange={(event) => setForm((prev) => ({ ...prev, from: event.target.value }))}
          />
        </Field>
        <span className="pb-3 text-[13px] text-ink-soft">to</span>
        <Field label="&nbsp;" className="flex-1">
          <Input
            type="date"
            value={form.to}
            onChange={(event) => setForm((prev) => ({ ...prev, to: event.target.value }))}
          />
        </Field>
      </div>

      <label className="mt-3 flex items-center gap-2.5">
        <Switch
          checked={form.yearly}
          onChange={(yearly) => setForm((prev) => ({ ...prev, yearly }))}
          label="Repeat yearly"
        />
        <span className="text-[13px] text-ink">Repeat this day off yearly</span>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!form.name || !form.from}
          onClick={() => {
            onAdd({ ...form, id: Math.random().toString(36).slice(2) });
            onCancel();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function StepDaysOff({ form, update }) {
  const [adding, setAdding] = useState(false);

  const toggleHoliday = (id) =>
    update({
      holidays: form.holidays.includes(id)
        ? form.holidays.filter((item) => item !== id)
        : [...form.holidays, id],
    });

  return (
    <div className="flex flex-col gap-3">
      {PUBLIC_HOLIDAYS.map((holiday) => {
        const on = form.holidays.includes(holiday.id);
        return (
          <button
            key={holiday.id}
            type="button"
            onClick={() => toggleHoliday(holiday.id)}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
              on ? "border-brand-600 bg-brand-50/50" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2",
                  on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"
                )}
              >
                {on ? <BadgeCheck className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-bold text-ink">
                  {holiday.name}
                </span>
                <span className="block truncate text-[12px] text-ink-soft">
                  {formatDate(holiday.from, "d MMM yyyy")} - {formatDate(holiday.to, "d MMM yyyy")}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-muted">
              <RefreshCw className="h-3.5 w-3.5" /> Repeat yearly
            </span>
          </button>
        );
      })}

      {form.daysOff.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3.5"
        >
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{entry.name}</span>
            <span className="block truncate text-[12px] text-ink-muted">
              {formatDate(entry.from, "d MMM yyyy")}
              {entry.to ? ` - ${formatDate(entry.to, "d MMM yyyy")}` : ""}
            </span>
          </span>
          <button
            type="button"
            aria-label="Remove day off"
            onClick={() => update({ daysOff: form.daysOff.filter((item) => item.id !== entry.id) })}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-white hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <AddDayOffCard
          onCancel={() => setAdding(false)}
          onAdd={(entry) => update({ daysOff: [...form.daysOff, entry] })}
        />
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit text-brand-600"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setAdding(true)}
        >
          Add day off
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- wizard */

export function StaffWizard({ open, onClose, member, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const { data: treatments = [] } = useAsync(() => clinicService.getTreatments(), [open], []);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(
      member
        ? {
            ...EMPTY,
            ...member,
            type: member.employment ?? EMPTY.type,
            services: member.services ?? [],
            cosmetics: member.cosmetics ?? [],
          }
        : EMPTY
    );
  }, [open, member]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const isDentist = form.role === "Dentist";

  const canContinue =
    step === 1 ? Boolean(form.name && (!isDentist || form.licence)) : true;

  const finish = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(member ? "Staff member updated" : "Staff member added", form.name);
      onSaved?.();
      onClose();
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : isDentist ? "Add new Doctor Staff" : "Add new Staff"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}>
            {step === 1 ? "Cancel" : "Previous"}
          </Button>
          <Button
            className="min-w-[120px]"
            disabled={!canContinue}
            loading={saving}
            onClick={() => (step === 4 ? finish() : setStep((s) => s + 1))}
          >
            {step === 4 ? "Save" : "Next"}
          </Button>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} className="mb-7" />

      {step === 1 ? <StepInfo form={form} update={update} isDentist={isDentist} /> : null}
      {step === 2 ? <StepServices form={form} update={update} treatments={treatments} /> : null}
      {step === 3 ? <StepHours form={form} update={update} /> : null}
      {step === 4 ? <StepDaysOff form={form} update={update} /> : null}
    </Modal>
  );
}
