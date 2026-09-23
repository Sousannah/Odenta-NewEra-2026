import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { CalendarClock, LayoutGrid, List, PlugZap, Plus, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { inventoryService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { Field, Input, MiniSelect, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, StatCard, StatGrid, Toolbar, toneFor } from "@/components/shared";

const STATUSES = ["Used", "Not Used", "Draft"];

function PeripheralCard({ item, onOpen }) {
  const dueDays = item.nextService
    ? differenceInCalendarDays(new Date(item.nextService), new Date())
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="od-card gap-3 p-5 text-left transition hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted">
          <Wrench className="h-5 w-5" />
        </span>
        <Badge tone={toneFor(item.status)}>{item.status}</Badge>
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-ink">{item.name}</h3>
        <p className="text-[12px] text-ink-soft">
          {item.series} · {item.sku}
        </p>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-muted">{item.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <Badge key={tag} tone="outline">
            {tag}
          </Badge>
        ))}
      </div>

      {dueDays != null ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-[12px]",
            dueDays <= 14 ? "font-bold text-danger" : "text-ink-soft"
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Service {dueDays <= 0 ? "overdue" : `in ${dueDays} day(s)`}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[12px] text-ink-soft">{item.assignedTo}</span>
        <span className="text-[15px] font-extrabold text-ink">
          {formatMoney(item.purchasePrice)}
        </span>
      </div>
    </button>
  );
}

function PeripheralFormModal({ open, onClose, item }) {
  const toast = useToast();
  const editing = Boolean(item);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? item.name : "Add peripheral"}
      description="Equipment assets, their assignment and service schedule."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success(editing ? "Peripheral updated" : "Peripheral added");
              onClose();
            }}
          >
            {editing ? "Save changes" : "Add peripheral"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" required>
            <Input defaultValue={item?.name ?? ""} />
          </Field>
          <Field label="Series">
            <Input defaultValue={item?.series ?? ""} />
          </Field>
          <Field label="Category">
            <Input defaultValue={item?.category ?? ""} />
          </Field>
          <Field label="SKU">
            <Input defaultValue={item?.sku ?? ""} />
          </Field>
          <Field label="Vendor">
            <Input defaultValue={item?.vendor ?? ""} />
          </Field>
          <Field label="Assigned to">
            <Input defaultValue={item?.assignedTo ?? ""} />
          </Field>
          <Field label="Purchase date">
            <Input type="date" defaultValue={item?.purchaseDate ?? ""} />
          </Field>
          <Field label="Purchase price (USD)">
            <Input type="number" defaultValue={item?.purchasePrice ?? 0} />
          </Field>
          <Field label="Invoice number">
            <Input defaultValue={item?.invoiceNumber ?? ""} />
          </Field>
          <Field label="Next service due">
            <Input type="date" defaultValue={item?.nextService ?? ""} />
          </Field>
          <Field label="Status">
            <Select defaultValue={item?.status ?? "Used"}>
              {STATUSES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Room">
            <Input defaultValue={item?.room ?? ""} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={3} defaultValue={item?.description ?? ""} />
        </Field>
      </div>
    </Modal>
  );
}

export default function PeripheralsPage() {
  const { can } = useAuth();
  const canManage = can(P.PERIPHERAL_MANAGE);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const form = useDisclosure();

  const { data: peripherals = [], loading } = useAsync(
    () => inventoryService.getPeripherals({ status, q: query }),
    [status, query],
    []
  );

  const totalValue = peripherals.reduce((sum, item) => sum + item.purchasePrice, 0);
  const dueService = peripherals.filter(
    (item) => item.nextService && differenceInCalendarDays(new Date(item.nextService), new Date()) <= 14
  );

  const openForm = (item = null) => {
    setSelected(item);
    form.open();
  };

  const columns = [
    {
      key: "name",
      header: "Product name",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-ink">{row.name}</span>
          <span className="block text-[12px] text-ink-soft">{row.series}</span>
        </span>
      ),
    },
    { key: "category", header: "Category", sortable: true },
    { key: "sku", header: "SKU" },
    { key: "vendor", header: "Vendor", sortable: true },
    { key: "assignedTo", header: "Assigned to" },
    {
      key: "nextService",
      header: "Next service",
      sortable: true,
      render: (row) => {
        if (!row.nextService) return <span className="text-ink-faint">—</span>;
        const days = differenceInCalendarDays(new Date(row.nextService), new Date());
        return (
          <span className={cn("text-[13px]", days <= 14 ? "font-bold text-danger" : "text-ink-muted")}>
            {formatDate(row.nextService, "d MMM yyyy")}
          </span>
        );
      },
    },
    {
      key: "purchasePrice",
      header: "Purchase price",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.purchasePrice)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Peripherals"
        description="Every chair, scanner and sterilizer the clinic owns, with its service schedule."
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
              Add peripheral
            </Button>
          ) : null
        }
      />

      <StatGrid cols={3}>
        <StatCard
          label="Total asset value"
          value={formatMoney(totalValue)}
          icon={<Wrench className="h-5 w-5" />}
        />
        <StatCard
          label="In use" value={peripherals.filter((item) => item.status === "Used").length} tone="success"
          icon={<PlugZap className="h-5 w-5" />}
        />
        <StatCard
          label="Service due soon"
          value={dueService.length}
          tone="warning"
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search equipment…"
              className="w-full sm:w-[300px]"
            />
            <MiniSelect
              className="h-10"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </MiniSelect>
          </>
        }
        right={
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            {[
              { id: "grid", icon: LayoutGrid },
              { id: "list", icon: List },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={`${id} view`}
                onClick={() => setView(id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center transition",
                  view === id ? "bg-brand-50 text-brand-600" : "bg-white text-ink-soft hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        }
      />

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {peripherals.map((item) => (
            <PeripheralCard key={item.id} item={item} onOpen={openForm} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={peripherals}
          loading={loading}
          onRowClick={openForm}
          emptyTitle="No peripherals"
        />
      )}

      <PeripheralFormModal open={form.isOpen} onClose={form.close} item={selected} />
    </div>
  );
}
