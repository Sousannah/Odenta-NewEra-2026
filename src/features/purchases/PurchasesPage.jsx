import { useState } from "react";
import { Download, Plus, Truck } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { financeService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { PURCHASE_STATUSES } from "@/config/domain";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { MiniSelect, Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, StatCard, Toolbar, toneFor } from "@/components/shared";

function PurchaseFormModal({ open, onClose }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create purchase order"
      description="Order stock, components or peripherals from a vendor."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success("Purchase order created");
              onClose();
            }}
          >
            Create order
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor" required>
            <Input placeholder="MedSupply Co." />
          </Field>
          <Field label="Category">
            <Select defaultValue="Medicine">
              {["Medicine", "Component", "Peripheral"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Order date">
            <Input type="date" />
          </Field>
          <Field label="Expected delivery">
            <Input type="date" />
          </Field>
          <Field label="Item count">
            <Input type="number" defaultValue={1} />
          </Field>
          <Field label="Total amount (USD)">
            <Input type="number" defaultValue={0} />
          </Field>
        </div>
        <Field label="Charge to account">
          <Select defaultValue="Stock Fund">
            {["Free Cash", "Drug Purchase", "Treatment Fund", "Stock Fund"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

export default function PurchasesPage() {
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const form = useDisclosure();

  const { data: purchases = [], loading } = useAsync(
    () => financeService.getPurchases({ status, q: query }),
    [status, query],
    []
  );

  const totalSpend = purchases
    .filter((row) => row.status !== "CANCELLED")
    .reduce((sum, row) => sum + row.total, 0);
  const inTransit = purchases.filter((row) => row.status === "IN TRANSIT").length;

  const columns = [
    { key: "id", header: "Order ID", sortable: true, render: (row) => <b>#{row.id}</b> },
    { key: "vendor", header: "Vendor", sortable: true },
    {
      key: "category",
      header: "Category",
      render: (row) => <Badge tone="neutral">{row.category}</Badge>,
    },
    {
      key: "orderDate",
      header: "Order date",
      sortable: true,
      render: (row) => formatDate(row.orderDate),
    },
    { key: "dueDate", header: "Due date", sortable: true, render: (row) => formatDate(row.dueDate) },
    { key: "items", header: "Items", align: "center" },
    { key: "account", header: "Account" },
    {
      key: "total",
      header: "Total",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.total)}</span>,
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
        title="Purchases"
        description="Track vendor orders from draft through delivery."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
            {can(P.PURCHASE_MANAGE) ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
                New purchase
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total spend"
          value={formatMoney(totalSpend)}
          icon={<Download className="h-5 w-5" />}
        />
        <StatCard
          label="Orders in transit"
          value={inTransit}
          tone="warning"
          icon={<Truck className="h-5 w-5" />}
        />
        <StatCard label="Orders this period" value={purchases.length} tone="success" />
      </div>

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search vendor or order…"
              className="w-[300px]"
            />
            <MiniSelect
              className="h-10"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              {PURCHASE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={purchases}
        loading={loading}
        emptyTitle="No purchase orders"
      />

      <PurchaseFormModal open={form.isOpen} onClose={form.close} />
    </div>
  );
}
