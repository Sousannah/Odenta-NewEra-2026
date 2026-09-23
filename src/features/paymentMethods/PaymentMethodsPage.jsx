import { Banknote, CreditCard, Landmark, Plus, QrCode, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch, Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/shared";

const ICONS = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  bank: Landmark,
  shield: ShieldCheck,
};

function MethodCard({ method, onToggle }) {
  const Icon = ICONS[method.icon] ?? Banknote;
  return (
    <article
      className={cn(
        "od-card gap-4 p-5 transition",
        method.enabled ? "border-slate-200" : "border-dashed bg-slate-50/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            method.enabled ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-ink-faint"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Switch checked={method.enabled} onChange={() => onToggle(method)} label={method.name} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-ink">{method.name}</h3>
          <Badge tone="neutral">{method.type}</Badge>
        </div>
        <p className="mt-1 text-[13px] text-ink-muted">{method.detail}</p>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-[12px]">
        <div>
          <dt className="od-label">Processing fee</dt>
          <dd className="mt-0.5 font-bold text-ink">
            {method.fee ? formatPercent(method.fee, 1) : "No fee"}
          </dd>
        </div>
        <div>
          <dt className="od-label">Settles into</dt>
          <dd className="mt-0.5 font-bold text-ink">{method.account}</dd>
        </div>
      </dl>
    </article>
  );
}

function MethodFormModal({ open, onClose, accounts }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add payment method"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success("Payment method added");
              onClose();
            }}
          >
            Add method
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Display name" required>
          <Input placeholder="e.g. GoPay" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select defaultValue="Wallet">
              {["Cash", "Card", "Wallet", "Transfer", "Insurance"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Processing fee (%)">
            <Input type="number" step="0.1" defaultValue={0} />
          </Field>
        </div>
        <Field label="Settles into account">
          <Select defaultValue={accounts[0]?.name}>
            {accounts.map((account) => (
              <option key={account.id}>{account.name}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

export default function PaymentMethodsPage() {
  const form = useDisclosure();
  const toast = useToast();

  const { data: methods = [], refetch } = useAsync(() => financeService.getPaymentMethods(), [], []);
  const { data: accounts = [] } = useAsync(
    () => financeService.getAccounts({ active: "true" }),
    [],
    []
  );

  const toggle = async (method) => {
    await financeService.setPaymentMethodEnabled(method.id, !method.enabled);
    toast.info(`${method.name} ${method.enabled ? "disabled" : "enabled"}`);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Payment method"
        description="Decide how patients can settle their bills at the front desk."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
            Add method
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => (
          <MethodCard key={method.id} method={method} onToggle={toggle} />
        ))}
      </div>

      <MethodFormModal open={form.isOpen} onClose={form.close} accounts={accounts} />
    </div>
  );
}
