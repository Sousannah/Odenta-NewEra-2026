import { useState } from "react";
import { LayoutGrid, List, Plus, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { Field, Input, MiniSelect, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, StatCard, Toolbar, toneFor } from "@/components/shared";

const STATUSES = ["Used", "Not Used", "Draft"];

function PeripheralCard({ item, onOpen }) {
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

      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
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
      description="Equipment assets, their assignment and purchase details."
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
          <Field label="Status">
            <Select defaultValue={item?.status ?? "Used"}>
              {STATUSES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const form = useDisclosure();

  const { data: peripherals = [], loading } = useAsync(
    () => clinicService.getPeripherals({ status, query }),
    [status, query],
    []
  );

  const totalValue = peripherals.reduce((sum, item) => sum + item.purchasePrice, 0);

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
      key: "purchaseDate",
      header: "Purchase date",
      sortable: true,
      render: (row) => formatDate(row.purchaseDate),
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
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Peripherals"
        description="Every chair, scanner and sterilizer the clinic owns, with its assignment."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
            Add peripheral
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total asset value" value={formatMoney(totalValue)} icon={<Wrench className="h-5 w-5" />} />
        <StatCard
          label="In use"
          value={peripherals.filter((item) => item.status === "Used").length}
          tone="success"
        />
        <StatCard
          label="Idle or draft"
          value={peripherals.filter((item) => item.status !== "Used").length}
          tone="warning"
        />
      </div>

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search equipment…"
              className="w-[300px]"
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
