import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Plus,
  Repeat,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge, TrendChip } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, StatBlock } from "@/components/shared";
import { ACCOUNT_COLOR_HEX, ACCOUNT_ICON_COMPONENTS, AccountIcon } from "./accountVisuals";
import { TransferMoneyModal } from "./TransferMoneyModal";

/* ---------------------------------------------------------- account card */

function AccountCard({ account, onMenu, canManage }) {
  return (
    <article className="od-card gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <AccountIcon icon={account.icon} color={account.color} />
        <div className="flex items-center gap-2">
          {account.isDefault ? <Badge tone="neutral">Default</Badge> : null}
          {canManage ? (
            <Dropdown
              items={[
                { value: "detail", label: "Detail account", icon: <Eye className="h-4 w-4" /> },
                { value: "transfer", label: "Transfer money", icon: <Repeat className="h-4 w-4" /> },
                { value: "deactivate", label: "Deactive", icon: <Ban className="h-4 w-4" /> },
                { value: "remove", label: "Remove", tone: "danger", icon: <Trash2 className="h-4 w-4" /> },
              ]}
              onSelect={(value) => onMenu(value, account)}
              trigger={
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
              }
            />
          ) : null}
        </div>
      </div>

      <div>
        <div className="od-label">{account.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[22px] font-extrabold text-ink">{formatMoney(account.balance)}</span>
          {account.change ? <TrendChip value={account.change} /> : null}
        </div>
      </div>

      <p className="mt-auto border-t border-slate-100 pt-3 text-[12px] text-ink-soft">
        {account.accountNo ? `No rek : ${account.accountNo}` : account.description}
      </p>
    </article>
  );
}

function InactiveCard({ account, onActivate, canManage }) {
  return (
    <article className="od-card gap-3 border-dashed bg-slate-50/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <AccountIcon icon={account.icon} color={account.color} muted />
        {canManage ? (
          <Button variant="secondary" size="sm" className="text-brand-600" onClick={() => onActivate(account)}>
            Activate
          </Button>
        ) : null}
      </div>

      <div>
        <div className="od-label">{account.name}</div>
        <div className="mt-1 text-[22px] font-extrabold text-ink-muted">
          {formatMoney(account.balance)}
        </div>
      </div>

      <p className="mt-auto border-t border-slate-200 pt-3 text-[12px] text-ink-soft">
        {account.accountNo ? `No rek : ${account.accountNo}` : account.description}
      </p>
    </article>
  );
}

/* ------------------------------------------------------- add / edit modal */

function AccountFormModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", description: "", icon: "cash", color: "pink", accountNo: "" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ name: "", description: "", icon: "cash", color: "pink", accountNo: "" });
    setPickerOpen(false);
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await financeService.createAccount(form);
      toast.success("Account created", form.name);
      onSaved?.();
      onClose();
    } catch (cause) {
      toast.error("Could not create account", cause.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add new account"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button className="min-w-[140px]" disabled={!form.name} loading={saving} onClick={save}>
            Create account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-[13px] font-semibold text-ink">Account Name</span>
          <div className="relative mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 p-2">
            <button
              type="button"
              onClick={() => setPickerOpen((value) => !value)}
              className="flex items-center gap-1 rounded-xl focus:outline-none"
              aria-label="Choose icon and colour"
            >
              <AccountIcon icon={form.icon} color={form.color} />
              <ChevronDown
                className={cn("h-4 w-4 text-ink-soft transition", pickerOpen && "rotate-180")}
              />
            </button>
            <input
              placeholder="i.e Treatment fund"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
            />

            {pickerOpen ? (
              <div className="absolute left-2 top-[64px] z-20 w-[196px] animate-scale-in rounded-2xl border border-slate-200 bg-white p-3 shadow-pop">
                <span className="text-[13px] font-bold text-ink">Colors</span>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {Object.entries(ACCOUNT_COLOR_HEX).map(([value, hex]) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={value}
                      onClick={() => setForm((prev) => ({ ...prev, color: value }))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: hex }}
                    >
                      {form.color === value ? (
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      ) : null}
                    </button>
                  ))}
                </div>

                <span className="mt-3 block text-[13px] font-bold text-ink">Icons</span>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {Object.keys(ACCOUNT_ICON_COMPONENTS).map((icon) => {
                    const Icon = ACCOUNT_ICON_COMPONENTS[icon];
                    const selected = form.icon === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        aria-label={icon}
                        onClick={() => setForm((prev) => ({ ...prev, icon }))}
                        className={cn(
                          "flex h-10 w-full items-center justify-center rounded-xl transition",
                          selected ? "text-white" : "bg-slate-100 text-ink-muted hover:bg-slate-200"
                        )}
                        style={selected ? { background: ACCOUNT_COLOR_HEX[form.color] } : undefined}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Field label="Description" counter={`${form.description.length} / 200`}>
          <Textarea
            rows={3}
            maxLength={200}
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </Field>

        <Field label="Bank account number" hint="Optional">
          <Input
            placeholder="124 1245 3567 0987"
            value={form.accountNo}
            onChange={(event) => setForm((prev) => ({ ...prev, accountNo: event.target.value }))}
          />
        </Field>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------- detail modal */

function AccountDetailModal({ open, onClose, accountId, onTransfer, canManage }) {
  const { data: account, loading } = useAsync(
    () => (accountId ? financeService.getAccount(accountId) : null),
    [accountId]
  );

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="sm" bodyClassName="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-ink">Detail Account</h2>
        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <IconButton label="Deactivate" size="sm" className="border border-slate-200">
                <Ban className="h-4 w-4 text-ink-muted" />
              </IconButton>
              <IconButton label="Remove" size="sm" className="border border-slate-200">
                <Trash2 className="h-4 w-4 text-ink-muted" />
              </IconButton>
            </>
          ) : null}
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-ink-muted" />
          </IconButton>
        </div>
      </div>

      {loading || !account ? (
        <div className="p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center px-6 py-6 text-center">
            <AccountIcon icon={account.icon} color={account.color} size="lg" />
            <h3 className="mt-3 text-[18px] font-extrabold text-ink">{account.name}</h3>
            <p className="mt-1 max-w-[280px] text-[12.5px] text-ink-soft">{account.description}</p>
            <p className="mt-3 text-[26px] font-extrabold text-ink">{formatMoney(account.balance)}</p>
            {account.accountNo ? (
              <p className="mt-1 text-[12px] text-ink-soft">No rek : {account.accountNo}</p>
            ) : null}
            {canManage ? (
              <Button
                className="mt-4"
                leftIcon={<Repeat className="h-4 w-4" />}
                onClick={() => onTransfer(account)}
              >
                Transfer Money
              </Button>
            ) : null}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
            {account.transactions?.length ? (
              <ol className="border-l-2 border-slate-200 pl-5">
                {account.transactions.map((entry) => (
                  <li key={entry.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-200">
                      <Upload
                        className={cn(
                          "h-2.5 w-2.5",
                          entry.direction === "in" ? "rotate-180 text-success" : "text-danger"
                        )}
                      />
                    </span>
                    <p className="text-[13px] text-ink">
                      {entry.label}{" "}
                      <b>{formatMoney(entry.amount)}</b>
                      {entry.billId ? (
                        <>
                          {" received from bill "}
                          <span className="font-bold text-brand-600 underline decoration-dotted">
                            #{entry.billId}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink-soft">
                      Added at {formatDate(entry.date, "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">By {entry.by}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No movements yet" className="py-8" />
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

export default function AccountsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can(P.ACCOUNT_MANAGE);

  const [detailId, setDetailId] = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [showInactive, setShowInactive] = useState(true);

  const detail = useDisclosure();
  const transfer = useDisclosure();
  const form = useDisclosure();
  const confirm = useDisclosure();

  const { data: accounts = [], loading, refetch } = useAsync(
    () => financeService.getAccounts(),
    [],
    []
  );

  const activeAccounts = useMemo(() => accounts.filter((item) => item.active), [accounts]);
  const inactiveAccounts = useMemo(() => accounts.filter((item) => !item.active), [accounts]);

  const liquid = activeAccounts.reduce((sum, item) => sum + item.balance, 0);
  const reserved = inactiveAccounts.reduce((sum, item) => sum + item.balance, 0);

  const handleMenu = async (action, account) => {
    if (action === "detail") {
      setDetailId(account.id);
      detail.open();
    } else if (action === "transfer") {
      setTransferFrom(account.id);
      transfer.open();
    } else if (action === "deactivate") {
      await financeService.setAccountActive(account.id, false);
      toast.info(`${account.name} deactivated`);
      refetch();
    } else if (action === "remove") {
      setPendingRemove(account);
      confirm.open();
    }
  };

  const activate = async (account) => {
    await financeService.setAccountActive(account.id, true);
    toast.success(`${account.name} activated`);
    refetch();
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <Card className="flex-row flex-wrap items-center gap-10 px-6 py-5">
        <StatBlock
          label="Total asset value"
          value={formatMoney(liquid + reserved)}
          icon={
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted">
              <Wallet className="h-5 w-5" />
            </span>
          }
        />
        <span className="hidden h-12 w-px bg-slate-200 sm:block" />
        <StatBlock label="Liquid assets" value={formatMoney(liquid)} change={4.51} />
        <StatBlock label="Reserved" value={formatMoney(reserved)} change={-2.51} />
      </Card>

      <PageHeader
        title="List Account"
        description="All account setup manually"
        actions={
          canManage ? (
            <>
              <Button
                variant="secondary"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => {
                  setTransferFrom(activeAccounts[0]?.id ?? null);
                  transfer.open();
                }}
              >
                Transfer money
              </Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
                Add new account
              </Button>
            </>
          ) : null
        }
      />

      <section>
        <div className="flex items-center gap-3">
          <span className="od-label">Active list</span>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[12px] font-bold text-ink-soft">{activeAccounts.length}</span>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : activeAccounts.length === 0 ? (
          <EmptyState title="No active accounts" description="Activate one below, or create a new pocket." />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onMenu={handleMenu}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </section>

      {inactiveAccounts.length ? (
        <section>
          <div className="flex items-center gap-3">
            <span className="od-label">Inactive list</span>
            <span className="h-px flex-1 bg-slate-200" />
            <button
              type="button"
              aria-label={showInactive ? "Collapse inactive accounts" : "Expand inactive accounts"}
              onClick={() => setShowInactive((value) => !value)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-ink-soft transition hover:text-brand-600"
            >
              <ChevronDown className={cn("h-4 w-4 transition", !showInactive && "-rotate-90")} />
            </button>
          </div>

          {showInactive ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inactiveAccounts.map((account) => (
                <InactiveCard
                  key={account.id}
                  account={account}
                  onActivate={activate}
                  canManage={canManage}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <AccountDetailModal
        open={detail.isOpen}
        onClose={detail.close}
        accountId={detailId}
        canManage={canManage}
        onTransfer={(account) => {
          detail.close();
          setTransferFrom(account.id);
          transfer.open();
        }}
      />

      <TransferMoneyModal
        open={transfer.isOpen}
        onClose={transfer.close}
        accounts={accounts}
        fromId={transferFrom}
        onDone={refetch}
      />

      <AccountFormModal open={form.isOpen} onClose={form.close} onSaved={refetch} />

      <ConfirmDialog
        open={confirm.isOpen}
        onClose={confirm.close}
        title={`Remove ${pendingRemove?.name ?? "account"}?`}
        description="The pocket is archived and its history is kept, but it can no longer receive money."
        confirmLabel="Remove account"
        onConfirm={async () => {
          if (!pendingRemove) return;
          await financeService.setAccountActive(pendingRemove.id, false);
          toast.error(`${pendingRemove.name} removed`);
          refetch();
        }}
      />
    </div>
  );
}
