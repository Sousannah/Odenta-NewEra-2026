import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Check, ChevronDown, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { formatMoney } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Dropdown } from "@/components/ui/Dropdown";
import { AccountIcon } from "./accountVisuals";

/**
 * Transfer money between pockets.
 *
 * Three stages, matching the reference flow: compose → confirm → receipt.
 * The confirmation step exists because a mis-typed transfer is annoying to
 * unwind, and the receipt gives the operator something to screenshot.
 */

function AccountPicker({ label, value, accounts, onChange, exclude }) {
  const selected = accounts.find((account) => account.id === value);
  const options = accounts.filter((account) => account.id !== exclude);

  return (
    <div>
      <span className="od-label">{label}</span>
      <Dropdown
        className="mt-2"
        align="left"
        menuClassName="w-full"
        value={value}
        trigger={
          <span className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 transition hover:border-brand-300">
            <AccountIcon icon={selected?.icon} color={selected?.color} size="sm" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                {selected?.name ?? "Select account"}
              </span>
              <span className="block truncate text-[15px] font-extrabold text-ink">
                {selected ? formatMoney(selected.balance) : "—"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-soft" />
          </span>
        }
      >
        {options.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onChange(account.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
              account.id === value ? "bg-brand-50" : "hover:bg-slate-100"
            )}
          >
            <AccountIcon icon={account.icon} color={account.color} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {account.name}
              </span>
              <span className="block truncate text-[13px] font-bold text-ink">
                {formatMoney(account.balance)}
              </span>
            </span>
            {account.id === value ? <Check className="h-4 w-4 text-success" /> : null}
          </button>
        ))}
      </Dropdown>
    </div>
  );
}

export function TransferMoneyModal({ open, onClose, accounts = [], fromId, onDone }) {
  const active = useMemo(() => accounts.filter((account) => account.active), [accounts]);
  const [stage, setStage] = useState("compose");
  const [from, setFrom] = useState(fromId ?? null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setStage("compose");
    setFrom(fromId ?? active[0]?.id ?? null);
    setTo(active.find((account) => account.id !== (fromId ?? active[0]?.id))?.id ?? null);
    setAmount("");
    setNote("");
    setReceipt(null);
  }, [open, fromId, active.length]);

  const fromAccount = active.find((account) => account.id === from);
  const toAccount = active.find((account) => account.id === to);
  const value = Number(amount);
  const tooMuch = fromAccount ? value > fromAccount.balance : false;
  const valid = fromAccount && toAccount && value > 0 && !tooMuch;

  const submit = async () => {
    setSaving(true);
    try {
      const result = await financeService.transfer({ fromId: from, toId: to, amount: value, note });
      setReceipt(result);
      setStage("done");
      onDone?.();
    } catch (cause) {
      toast.error("Transfer failed", cause.message);
      setStage("compose");
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------------------- receipt */

  if (stage === "done" && receipt) {
    return (
      <Modal open={open} onClose={onClose} title="Transfer money" size="sm">
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-white">
            <Check className="h-9 w-9" strokeWidth={3} />
          </span>

          <span className="od-label mt-5 block">Amount</span>
          <span className="text-[26px] font-extrabold text-ink">{formatMoney(receipt.amount)}</span>
          <span className="mt-1 text-[12px] text-ink-soft">
            {new Date(receipt.at).toLocaleString()} · {receipt.reference}
          </span>

          <div className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-left">
            <div className="flex items-center gap-2.5">
              <AccountIcon icon={receipt.from.icon} color={receipt.from.color} size="sm" />
              <span className="text-[13px] text-ink-muted">
                From: <b className="text-ink">{receipt.from.name}</b>
              </span>
            </div>
            <div className="my-2 ml-4 flex flex-col gap-0.5">
              <ArrowDown className="h-3.5 w-3.5 text-ink-faint" />
            </div>
            <div className="flex items-center gap-2.5">
              <AccountIcon icon={receipt.to.icon} color={receipt.to.color} size="sm" />
              <span className="text-[13px] text-ink-muted">
                To: <b className="text-ink">{receipt.to.name}</b>
              </span>
            </div>
          </div>

          {receipt.note ? (
            <div className="mt-4 w-full">
              <span className="text-[12px] font-bold text-ink">Note:</span>
              <p className="mt-1 text-[12.5px] text-ink-muted">{receipt.note}</p>
            </div>
          ) : null}

          <Button variant="secondary" block className="mt-5 text-brand-600" onClick={onClose}>
            Oke
          </Button>
        </div>
      </Modal>
    );
  }

  /* ----------------------------------------------------------- confirmation */

  if (stage === "confirm") {
    return (
      <Modal open={open} onClose={onClose} title="Confirmation" size="sm">
        <div className="flex flex-col items-center py-6 text-center">
          <h3 className="max-w-[260px] text-[20px] font-extrabold leading-snug text-ink">
            Are you sure you want to transfer?
          </h3>

          <span className="od-label mt-5 block">Amount</span>
          <span className="text-[26px] font-extrabold text-ink">{formatMoney(value)}</span>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px] text-ink-muted">
            <span>from</span>
            <span className="flex items-center gap-1.5">
              <AccountIcon icon={fromAccount.icon} color={fromAccount.color} size="sm" />
              <b className="text-ink">{fromAccount.name}</b>
            </span>
            <span>to</span>
            <span className="flex items-center gap-1.5">
              <AccountIcon icon={toAccount.icon} color={toAccount.color} size="sm" />
              <b className="text-ink">{toAccount.name}</b>
            </span>
          </div>

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <Button variant="secondary" className="text-brand-600" onClick={() => setStage("compose")}>
              Cancel
            </Button>
            <Button loading={saving} onClick={submit}>
              Transfer
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ----------------------------------------------------------------- compose */

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Money"
      size="sm"
      footer={
        <>
          <Button variant="secondary" className="min-w-[120px] text-brand-600" onClick={onClose}>
            Cancel
          </Button>
          <Button className="min-w-[140px]" disabled={!valid} onClick={() => setStage("confirm")}>
            Transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <AccountPicker
          label="Transfer from"
          value={from}
          accounts={active}
          exclude={to}
          onChange={setFrom}
        />

        <div className="flex items-stretch gap-3">
          <span className="ml-4 flex w-5 flex-col items-center justify-center gap-1 text-ink-faint">
            {Array.from({ length: 6 }).map((_, index) => (
              <ChevronDown key={index} className="h-3 w-3" />
            ))}
          </span>
          <div className="min-w-0 flex-1">
            <span className="od-label">Amount</span>
            <span className="relative mt-2 block">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-soft">
                $
              </span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 pl-8 pr-3.5 text-[15px] font-bold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
              />
            </span>
            {tooMuch ? (
              <p className="mt-1.5 text-[12px] font-semibold text-danger">
                Only {formatMoney(fromAccount.balance)} available in {fromAccount.name}.
              </p>
            ) : null}
          </div>
        </div>

        <AccountPicker
          label="Transfer to"
          value={to}
          accounts={active}
          exclude={from}
          onChange={setTo}
        />

        <Field label="Add Note" hint="Optional" counter={`${note.length} / 200`}>
          <Textarea
            rows={3}
            maxLength={200}
            placeholder="Type a message"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        <p className="flex items-center gap-2 text-[12px] text-ink-soft">
          <Repeat className="h-3.5 w-3.5" />
          Both sides of the transfer are written to the ledger and the audit log.
        </p>
      </div>
    </Modal>
  );
}
