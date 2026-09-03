import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  Pill,
  Plus,
  Repeat,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge, TrendChip } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/shared";

const ICONS = { wallet: Wallet, pill: Pill, tooth: Wallet, box: Box };

const TONES = {
  success: "bg-success-soft text-success-strong",
  violet: "bg-[#EDE9FE] text-violet",
  rose: "bg-danger-soft text-danger",
  amber: "bg-warning-soft text-[#B27B04]",
};

function AccountCard({ account, active, onSelect }) {
  const Icon = ICONS[account.icon] ?? Wallet;
  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className={cn(
        "od-card items-start gap-3 p-5 text-left transition hover:shadow-pop",
        active && "ring-2 ring-brand-600/30"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            TONES[account.tone] ?? TONES.success
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {account.isDefault ? <Badge tone="neutral">Default</Badge> : null}
      </div>

      <div className="w-full">
        <div className="text-[13.5px] font-bold text-ink">{account.name}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[22px] font-extrabold text-ink">
            {formatMoney(account.balance)}
          </span>
          <TrendChip value={account.change} />
        </div>
        <p className="mt-2 line-clamp-2 text-[12px] text-ink-soft">{account.description}</p>
      </div>
    </button>
  );
}

function TransferModal({ open, onClose, accounts }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer money"
      description="Move funds between clinic pockets without leaving the ledger."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success("Transfer completed");
              onClose();
            }}
          >
            Transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="From account">
          <Select defaultValue={accounts[0]?.id}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {formatMoney(account.balance)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Repeat className="h-4 w-4" />
          </span>
        </div>

        <Field label="To account">
          <Select defaultValue={accounts[1]?.id}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {formatMoney(account.balance)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Amount">
          <Input type="number" placeholder="0.00" />
        </Field>

        <Field label="Note" hint="Optional">
          <Textarea rows={2} placeholder="What is this transfer for?" />
        </Field>
      </div>
    </Modal>
  );
}

export default function AccountsPage() {
  const [selected, setSelected] = useState(null);
  const transfer = useDisclosure();

  const { data: accounts = [], loading } = useAsync(() => financeService.getAccounts(), [], []);
  const { data: transactions = [] } = useAsync(
    () => financeService.getAccountTransactions(selected?.id),
    [selected?.id],
    []
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const columns = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => formatDate(row.date, "dd MMM yyyy · HH:mm"),
    },
    {
      key: "label",
      header: "Description",
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold text-ink">{row.label}</span>
          <span className="block text-[12px] text-ink-soft">Ref {row.reference}</span>
        </span>
      ),
    },
    { key: "method", header: "Method" },
    { key: "by", header: "Recorded by" },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-bold",
            row.direction === "in" ? "text-success-strong" : "text-danger"
          )}
        >
          {row.direction === "in" ? (
            <ArrowDownLeft className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" />
          )}
          {formatMoney(row.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Accounts"
        description="Pockets that collect and track money from every transaction and expense."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Repeat className="h-4 w-4" />} onClick={transfer.open}>
              Transfer money
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>New account</Button>
          </>
        }
      />

      <Card className="flex-row flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <Caption>Total balance across accounts</Caption>
          <div className="mt-1.5 text-[28px] font-extrabold text-ink">
            {formatMoney(totalBalance)}
          </div>
        </div>
        <div className="text-[13px] text-ink-muted">
          {accounts.length} accounts · updated a few seconds ago
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="od-card h-40 animate-pulse bg-slate-50" />
            ))
          : accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                active={selected?.id === account.id}
                onSelect={(next) => setSelected(next.id === selected?.id ? null : next)}
              />
            ))}
      </div>

      <Card>
        <CardHeader
          title={selected ? `${selected.name} transactions` : "All transactions"}
          subtitle={
            selected
              ? "Showing movements for the selected pocket"
              : "Select an account above to filter this ledger"
          }
        />
        <CardBody className="pt-3">
          <DataTable
            columns={columns}
            rows={transactions}
            dense
            emptyTitle="No transactions"
            className="border-0 shadow-none"
          />
        </CardBody>
      </Card>

      <TransferModal open={transfer.isOpen} onClose={transfer.close} accounts={accounts} />
    </div>
  );
}
