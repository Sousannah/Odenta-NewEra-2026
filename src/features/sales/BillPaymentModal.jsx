import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Landmark,
  MessageSquare,
  MoreHorizontal,
  Pill,
  Printer,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

const METHOD_ICON = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  bank: Landmark,
  shield: ShieldCheck,
};

const QUICK_AMOUNTS = [20, 30, 50, 100];

/* ---------------------------------------------------------- bill details */

function LineGroup({ icon, title, total, items }) {
  return (
    <div className="border-t border-slate-100 py-3 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
          {icon}
          {title}
        </span>
        <span className="text-[13px] font-semibold text-ink-muted">
          Total: {formatMoney(total)}
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.name} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-ink">{item.name}</span>
              {item.detail ? (
                <span className="block text-[12px] text-ink-soft">{item.detail}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-[13px] font-bold text-ink">
              {item.amount ? formatMoney(item.amount) : "Include in service"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------- history & notes */

function HistoryPanel({ billId, onClose }) {
  const { data: comments = [] } = useAsync(
    () => financeService.getBillComments(billId),
    [billId],
    []
  );
  const [draft, setDraft] = useState("");
  const toast = useToast();

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-ink">History and comment</h3>
        <IconButton
          label="Close"
          size="sm"
          onClick={onClose}
          className="bg-slate-100 text-ink-muted hover:bg-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="flex gap-3">
          <span className="mt-1 h-8 w-8 shrink-0 rounded-full bg-warning-soft" />
          <div className="min-w-0 flex-1">
            <Textarea
              rows={3}
              placeholder="Add new comment"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button
              size="sm"
              className="mt-2.5"
              disabled={!draft.trim()}
              onClick={() => {
                toast.success("Comment added");
                setDraft("");
              }}
            >
              Add comment
            </Button>
          </div>
        </div>

        <ol className="mt-6 border-l-2 border-slate-100 pl-6">
          {comments.map((entry) => (
            <li key={entry.id} className="relative pb-6">
              <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-slate-100">
                {entry.type === "comment" ? (
                  <MessageSquare className="h-3 w-3 text-ink-soft" />
                ) : (
                  <ReceiptText className="h-3 w-3 text-brand-600" />
                )}
              </span>

              {entry.type === "comment" ? (
                <>
                  <div className="text-[13px]">
                    <b className="text-ink">{entry.author}</b>{" "}
                    <span className="text-ink-soft">added comment</span>
                  </div>
                  <div className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-[13px] text-ink">
                    {entry.body}
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-ink-soft">
                    Added at {new Date(entry.at).toLocaleString()} ·{" "}
                    <button type="button" className="font-bold text-brand-600">
                      Reply
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[13.5px] font-semibold text-ink">{entry.body}</div>
                  <div className="mt-1 text-[11.5px] text-ink-soft">
                    Added at {new Date(entry.at).toLocaleString()}
                  </div>
                  <div className="mt-1 text-[12px] text-ink-muted">By {entry.author}</div>
                  {entry.note ? (
                    <div className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] text-ink-muted">
                      {entry.note}
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

export function BillPaymentModal({ open, onClose, bill }) {
  const [stage, setStage] = useState("overview");
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: methods = [] } = useAsync(() => financeService.getPaymentMethods(), [], []);
  const { data: accounts = [] } = useAsync(() => financeService.getAccounts(), [], []);

  useEffect(() => {
    if (!open) return;
    setStage("overview");
    setMethod(null);
    setAmount(bill ? String(bill.total) : "");
    setShowHistory(false);
    setShowDetails(false);
  }, [open, bill]);

  if (!bill) return null;

  const breakdown = bill.breakdown ?? { treatments: [], components: [], medicine: [] };
  const sum = (items) => items.reduce((total, item) => total + Number(item.amount || 0), 0);
  const subtotal =
    sum(breakdown.treatments) + sum(breakdown.components) + sum(breakdown.medicine);

  const enabledMethods = methods.filter((item) => item.enabled);
  const visibleMethods = showDetails ? enabledMethods : enabledMethods.slice(0, 2);

  /* ------------------------------------------------------------ success */

  if (stage === "success") {
    return (
      <Modal open={open} onClose={onClose} size="sm" bodyClassName="px-6 py-8">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success-strong">
            <ReceiptText className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-[20px] font-extrabold text-ink">Payment successfully</h2>
          <p className="mt-3 od-label">Amount</p>
          <p className="text-[26px] font-extrabold text-ink">{formatMoney(amount || bill.total)}</p>
          <p className="mt-1 text-[12px] text-ink-soft">
            {new Date().toLocaleDateString()} · Bill ID: #{bill.id}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 px-4 py-3">
          <h3 className="text-[14px] font-bold text-ink">Payment Details</h3>
          <div className="mt-2">
            <LineGroup
              icon={<Stethoscope className="h-4 w-4 text-ink-soft" />}
              title={`Treatment (${breakdown.treatments.length})`}
              total={sum(breakdown.treatments)}
              items={breakdown.treatments}
            />
            <LineGroup
              icon={<Wrench className="h-4 w-4 text-ink-soft" />}
              title={`Component used (${breakdown.components.length})`}
              total={sum(breakdown.components)}
              items={breakdown.components}
            />
            <LineGroup
              icon={<Pill className="h-4 w-4 text-ink-soft" />}
              title={`Medicine (${breakdown.medicine.length})`}
              total={sum(breakdown.medicine)}
              items={breakdown.medicine}
            />
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <span className="od-label">Detail transaction</span>
            <dl className="mt-2 flex flex-col gap-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Amount paid</dt>
                <dd className="font-bold text-ink">{formatMoney(amount || bill.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Change money</dt>
                <dd className="font-bold text-ink">
                  {formatMoney(Math.max(Number(amount || 0) - subtotal, 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Payment method</dt>
                <dd className="font-bold text-ink">{method?.name ?? "Cash"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            leftIcon={<CalendarCheck className="h-4 w-4" />}
            onClick={onClose}
          >
            Back to Calendar
          </Button>
          <Button variant="secondary" leftIcon={<Printer className="h-4 w-4" />}>
            Print Reciept
          </Button>
        </div>
      </Modal>
    );
  }

  /* ------------------------------------------------------------- payment */

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={showHistory ? "xl" : "md"}
      bodyClassName="p-0"
      className="overflow-hidden"
    >
      <div className="flex">
        {showHistory ? (
          <div className="h-[640px] w-[440px] shrink-0">
            <HistoryPanel billId={bill.id} onClose={() => setShowHistory(false)} />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink-muted">Bill ID</span>
              <span className="text-[15px] font-extrabold text-ink">#{bill.id}</span>
            </span>
            <span className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                onClick={() => setShowHistory((value) => !value)}
              >
                History &amp; comment
              </Button>
              <IconButton label="More" size="sm" className="border border-slate-200">
                <MoreHorizontal className="h-4 w-4 text-ink-muted" />
              </IconButton>
            </span>
          </header>

          <div className="max-h-[560px] min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {stage === "overview" ? (
              <>
                <Field label="Select Account">
                  <Select defaultValue={accounts[0]?.id}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                        {account.isDefault ? " · DEFAULT" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="mt-5 rounded-2xl border border-slate-200 px-4 py-2">
                  <LineGroup
                    icon={<Stethoscope className="h-4 w-4 text-ink-soft" />}
                    title={`Treatment (${breakdown.treatments.length})`}
                    total={sum(breakdown.treatments)}
                    items={breakdown.treatments}
                  />
                  <LineGroup
                    icon={<Wrench className="h-4 w-4 text-ink-soft" />}
                    title={`Component used (${breakdown.components.length})`}
                    total={sum(breakdown.components)}
                    items={breakdown.components}
                  />
                  <LineGroup
                    icon={<Pill className="h-4 w-4 text-ink-soft" />}
                    title={`Medicine (${breakdown.medicine.length})`}
                    total={sum(breakdown.medicine)}
                    items={breakdown.medicine}
                  />
                </div>

                <Field label="Add Note" hint="Optional" className="mt-5">
                  <Textarea rows={2} placeholder="Type a message..." />
                </Field>

                <dl className="mt-5 flex flex-col gap-2 text-[13.5px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatMoney(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Tax</dt>
                    <dd className="font-semibold text-ink">{formatMoney(0)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <dt className="font-bold text-ink">Total</dt>
                    <dd className="text-[16px] font-extrabold text-ink">{formatMoney(subtotal)}</dd>
                  </div>
                </dl>

                <InfoBanner tone="success" className="mt-4" icon={<ShieldCheck className="h-4 w-4" />}>
                  All your transactions are secure and fast.
                </InfoBanner>

                <div className="mt-5 rounded-2xl border-2 border-brand-100 p-3">
                  <span className="od-label">Select a payment method</span>
                  <div className="mt-2.5 flex flex-col gap-2.5">
                    {visibleMethods.map((item) => {
                      const Icon = METHOD_ICON[item.icon] ?? Banknote;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMethod(item);
                            setAmount(String(subtotal));
                            setStage("method");
                          }}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-ink-muted" />
                            <span className="text-[13.5px] font-semibold text-ink">{item.name}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-ink-soft" />
                        </button>
                      );
                    })}
                  </div>
                  {enabledMethods.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => setShowDetails((value) => !value)}
                      className="mt-2.5 text-[13px] font-bold text-brand-600 hover:text-brand-800"
                    >
                      {showDetails ? "Show Less ▴" : "Show More ▾"}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            {stage === "method" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStage("overview")}
                  className="text-[13px] font-bold text-brand-600 hover:text-brand-800"
                >
                  ← Back
                </button>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="text-[18px] font-extrabold text-ink">Total Payment</h3>
                  <span className="text-[20px] font-extrabold text-ink">
                    {formatMoney(subtotal)}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <span className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                    {method?.name}
                  </span>

                  <Field label="Input amount" className="mt-3">
                    <span className="relative block">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink">
                        $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 pl-8 pr-3.5 text-sm font-bold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                      />
                    </span>
                  </Field>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {QUICK_AMOUNTS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(String(Number(amount || 0) + value))}
                        className="h-10 rounded-xl border border-slate-200 text-[13px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-600"
                      >
                        {formatMoney(value)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  block
                  className="mt-5"
                  disabled={Number(amount) < subtotal}
                  onClick={() => setStage("success")}
                >
                  Pay
                </Button>
                {Number(amount) < subtotal ? (
                  <p className="mt-2 text-center text-[12px] text-danger">
                    Amount is below the total due.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
