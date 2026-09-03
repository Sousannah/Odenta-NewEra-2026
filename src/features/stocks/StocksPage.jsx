import { useState } from "react";
import { Boxes, Filter, PackagePlus, ShoppingCart } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { STOCK_STATUSES } from "@/config/domain";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { Field, Input, MiniSelect, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Stepper";
import { PageHeader, StatCard, Toolbar, toneFor } from "@/components/shared";

function StockFormModal({ open, onClose }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New product"
      description="Track a consumable, medicine or component in the clinic inventory."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success("Product added to inventory");
              onClose();
            }}
          >
            Add product
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Product name" required>
          <Input placeholder="Composite Porseline" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select defaultValue="Consumable">
              {["Consumable", "Medicine", "Restorative", "Endodontic", "Orthodontic", "Cosmetic", "Preventive", "Impression"].map(
                (option) => (
                  <option key={option}>{option}</option>
                )
              )}
            </Select>
          </Field>
          <Field label="SKU">
            <Input placeholder="CP-3320" />
          </Field>
          <Field label="Vendor">
            <Input placeholder="DentaLab Indonesia" />
          </Field>
          <Field label="Unit">
            <Input placeholder="pcs" />
          </Field>
          <Field label="Quantity">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="Reorder threshold">
            <Input type="number" defaultValue={20} />
          </Field>
        </div>
        <Field label="Asset value (USD)">
          <Input type="number" defaultValue={0} />
        </Field>
      </div>
    </Modal>
  );
}

export default function StocksPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const form = useDisclosure();
  const toast = useToast();

  const { data: stocks = [], loading } = useAsync(
    () => clinicService.getStocks({ status, query }),
    [status, query],
    []
  );

  const totalAsset = stocks.reduce((sum, item) => sum + item.assetValue, 0);
  const lowCount = stocks.filter((item) => item.status !== "IN STOCK").length;

  const columns = [
    {
      key: "name",
      header: "Product name",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-ink">{row.name}</span>
          <span className="block text-[12px] text-ink-soft">{row.sku}</span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => <Badge tone="neutral">{row.category}</Badge>,
    },
    { key: "vendor", header: "Vendor", sortable: true },
    {
      key: "quantity",
      header: "Stock",
      sortable: true,
      width: 180,
      render: (row) => {
        const ratio = Math.min((row.quantity / Math.max(row.reorderAt * 2, 1)) * 100, 100);
        const tone = row.status === "IN STOCK" ? "success" : row.status === "LOW STOCK" ? "warning" : "brand";
        return (
          <span className="block">
            <span className="flex items-baseline justify-between text-[12px]">
              <b className="text-[13px] text-ink">
                {formatNumber(row.quantity)} {row.unit}
              </b>
              <span className="text-ink-soft">min {row.reorderAt}</span>
            </span>
            <ProgressBar value={ratio} tone={tone} className="mt-1.5" />
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
    },
    {
      key: "assetValue",
      header: "Asset value",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.assetValue)}</span>,
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Stocks"
        description="Monitor supplies in real time, anticipate reorders and avoid running out."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<ShoppingCart className="h-4 w-4" />}
              className="text-brand-600"
              onClick={() => toast.info("Order draft created", `${lowCount} item(s) below threshold`)}
            >
              Order Stock
            </Button>
            <Button leftIcon={<PackagePlus className="h-4 w-4" />} onClick={form.open}>
              New Products
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total asset value" value={formatMoney(totalAsset)} icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Products tracked" value={stocks.length} tone="success" />
        <StatCard label="Needs attention" value={lowCount} tone="warning" />
      </div>

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search product, SKU or vendor…"
              className="w-[300px]"
            />
            <MiniSelect
              className="h-10"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              {STOCK_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </MiniSelect>
          </>
        }
        right={
          <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
            Filters
          </Button>
        }
      />

      <DataTable columns={columns} rows={stocks} loading={loading} emptyTitle="No products" />

      <StockFormModal open={form.isOpen} onClose={form.close} />
    </div>
  );
}
