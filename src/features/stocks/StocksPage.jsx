import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  Filter,
  Minus,
  PackagePlus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { assistantService, inventoryService } from "@/services";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { STOCK_STATUSES } from "@/config/domain";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { Field, Input, MiniSelect, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Stepper";
import { Card } from "@/components/ui/Card";
import { SegmentBar } from "@/components/charts";
import { StatBlock, Toolbar, toneFor } from "@/components/shared";
import { accent, semantic } from "@/theme/tokens";

const CATEGORIES = [
  "Consumable",
  "Medicine",
  "Restorative",
  "Endodontic",
  "Orthodontic",
  "Cosmetic",
  "Preventive",
  "Impression",
  "Pain and Anxiety",
  "Anti-inflammatory",
  "Plaque and Gingivitis",
  "Periodontal Disease",
];

function StockFormModal({ open, onClose, onSaved }) {
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
              onSaved?.();
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
              {CATEGORIES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="SKU">
            <Input placeholder="ZKS8124" />
          </Field>
          <Field label="Vendor">
            <Input placeholder="DentaLab Indonesia" />
          </Field>
          <Field label="Unit">
            <Input placeholder="pcs" />
          </Field>
          <Field label="Quantity on hand">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="Reorder threshold">
            <Input type="number" defaultValue={20} />
          </Field>
          <Field label="Unit cost (USD)">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="Expiry date" hint="if applicable">
            <Input type="date" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/** Chairside consumption — the assistant records what a case used. */
function ConsumeModal({ open, onClose, stock, onSaved, appointmentId = null, patientId = null }) {
  const [quantity, setQuantity] = useState(1);
  const toast = useToast();

  if (!stock) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record usage · ${stock.name}`}
      description={`${formatNumber(stock.quantity)} ${stock.unit} on hand`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[130px]"
            disabled={quantity < 1 || quantity > stock.quantity}
            onClick={async () => {
              try {
                /**
                 * The relative endpoint, not a PATCH of the absolute quantity.
                 *
                 * This used to send `quantity: onHand - used`, computed from the
                 * count the screen was showing. Two assistants consuming from
                 * the same box in the same second each wrote an absolute figure
                 * derived from the same stale read, so one of the two
                 * consumptions silently vanished — and the shelf then disagreed
                 * with the shelf. The server applies a delta with an atomic
                 * increment instead, so both land.
                 */
                const outcome = await assistantService.consumeStock(stock.id, quantity, {
                  appointmentId: appointmentId ?? null,
                  patientId: patientId ?? null,
                });

                /* Not an error: the physical act already happened at the chair,
                   so taking three when five were asked for is reported rather
                   than refused. */
                if (outcome?.shortfall > 0) {
                  toast.info(
                    `Only ${outcome.consumed} ${stock.unit} were available`,
                    `${outcome.shortfall} short — ${stock.name} is now ${outcome.status?.toLowerCase()}`
                  );
                } else {
                  toast.success("Usage recorded", `${outcome?.consumed ?? quantity} ${stock.unit} of ${stock.name}`);
                }
                onSaved?.();
                onClose();
              } catch (cause) {
                toast.error("Could not record usage", cause.message);
              }
            }}
          >
            Record usage
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => setQuantity((value) => Math.max(value - 1, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-ink-muted transition hover:border-slate-300"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-20 text-center text-[28px] font-extrabold text-ink">{quantity}</span>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => setQuantity((value) => Math.min(value + 1, stock.quantity))}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-ink-muted transition hover:border-slate-300"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-[12.5px] text-ink-soft">
        Leaves {formatNumber(Math.max(stock.quantity - quantity, 0))} {stock.unit} on hand.
      </p>
    </Modal>
  );
}

export default function StocksPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [consuming, setConsuming] = useState(null);

  const form = useDisclosure(params.get("new") === "1");
  const consume = useDisclosure();

  const { data: stocks = [], loading, refetch } = useAsync(
    () => inventoryService.getStocks({ status, category, q: query }),
    [status, category, query],
    []
  );
  const { data: orders = [], refetch: refetchOrders } = useAsync(
    () => inventoryService.getStockOrders(),
    [],
    []
  );

  /**
   * The totals, from the server rather than from the rows on screen.
   *
   * These four numbers used to be `stocks.reduce(...)` and
   * `stocks.filter(...).length` over the fetched array. That was merely
   * expensive while the endpoint returned the whole shelf; now that it is
   * continuation-paged it is **wrong** — a practice with more lines than one
   * page would see a valuation and three segment counts that silently describe
   * the first fifty rows and nothing else.
   *
   * A total must never be the length of a page. The server keeps these on one
   * small document its writes maintain, so this is a point read that is flat in
   * the size of the shelf.
   */
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => assistantService.getStockSummary(),
    [],
    null
  );

  /**
   * What to order, and what is about to expire — also folded server-side.
   *
   * The expiry list in particular could not be right on the client: an item
   * expiring next month is not *low*, so it never appeared on a page filtered
   * by status, and the old `stocks.filter(expiry <= 60d)` only ever saw
   * whatever page happened to be loaded.
   */
  const { data: reorder } = useAsync(() => assistantService.getReorderList(), [], null);

  const closeForm = () => {
    form.close();
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const totalAsset = summary?.stockValue ?? 0;
  const lineCount = summary?.lineCount ?? stocks.length;
  const inStockCount = Math.max(
    0,
    lineCount - (summary?.stockLowCount ?? 0) - (summary?.stockOutCount ?? 0)
  );

  const segments = [
    { name: "In stock", value: inStockCount, color: accent[500] },
    { name: "Low stock", value: summary?.stockLowCount ?? 0, color: semantic.warning },
    { name: "Out of stock", value: summary?.stockOutCount ?? 0, color: semantic.danger },
  ];

  const expiringSoon = reorder?.expiring ?? [];

  const reloadAll = () => {
    refetch();
    refetchSummary();
  };

  const inventoryColumns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-muted">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
            <span className="block truncate text-[12px] text-ink-soft">{row.sku}</span>
          </span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Categories",
      sortable: true,
      render: (row) => <span className="text-[13px] text-ink-muted">{row.category}</span>,
    },
    { key: "vendor", header: "Vendor", sortable: true },
    {
      key: "quantity",
      header: "Stock",
      sortable: true,
      width: 170,
      render: (row) => {
        const ratio = Math.min((row.quantity / Math.max(row.reorderAt * 2, 1)) * 100, 100);
        const tone =
          row.status === "IN STOCK" ? "success" : row.status === "LOW STOCK" ? "warning" : "brand";
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
      key: "expiry",
      header: "Expiry",
      sortable: true,
      render: (row) => {
        if (!row.expiry) return <span className="text-ink-faint">—</span>;
        const days = differenceInCalendarDays(new Date(row.expiry), new Date());
        return (
          <span className={cn("text-[13px]", days <= 60 ? "font-bold text-danger" : "text-ink-muted")}>
            {formatDate(row.expiry, "MMM yyyy")}
            {days <= 60 ? ` · ${days}d` : ""}
          </span>
        );
      },
    },
    {
      key: "assetValue",
      header: "Asset value",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.assetValue)}</span>,
    },
    ...(can(P.STOCK_CONSUME)
      ? [
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) =>
              row.quantity > 0 ? (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConsuming(row);
                    consume.open();
                  }}
                >
                  Use
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  const orderColumns = [
    { key: "id", header: "Request", sortable: true, render: (row) => <b>#{row.id}</b> },
    { key: "name", header: "Product", sortable: true },
    { key: "vendor", header: "Vendor", sortable: true },
    { key: "quantity", header: "Quantity", align: "center", sortable: true },
    {
      key: "value",
      header: "Estimated cost",
      align: "right",
      sortValue: (row) => row.quantity * row.unitCost,
      render: (row) => (
        <span className="font-bold">{formatMoney(row.quantity * row.unitCost)}</span>
      ),
    },
    { key: "requestedBy", header: "Requested by" },
    {
      key: "requestedAt",
      header: "Requested",
      sortable: true,
      render: (row) => formatDate(row.requestedAt),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <Card className="flex-row flex-wrap items-center gap-10 px-6 py-5">
        <StatBlock
          label="Total asset value"
          value={formatMoney(totalAsset)}
          icon={
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Boxes className="h-5 w-5" />
            </span>
          }
        />
        <span className="hidden h-12 w-px bg-slate-200 sm:block" />
        <div className="min-w-[280px] flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold text-ink">{lineCount}</span>
            <span className="text-[13px] text-ink-soft">product</span>
          </div>
          <SegmentBar segments={segments} className="mt-3" />
          <div className="mt-2.5 flex flex-wrap gap-4">
            {segments.map((segment) => (
              <span key={segment.name} className="flex items-center gap-2 text-[12px] text-ink-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
                {segment.name}: <b className="text-ink">{segment.value}</b>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {expiringSoon.length ? (
        <div className="flex items-center gap-3 rounded-2xl bg-warning-soft px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span className="text-[13px] font-semibold text-warning-ink">
            {expiringSoon.length} item(s) expire within 60 days:{" "}
            {expiringSoon.map((item) => item.name).join(", ")}
          </span>
        </div>
      ) : null}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory" badge={lineCount}>
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" badge={orders.length}>
            Order Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="pt-5">
          <Toolbar
            className="mb-4"
            left={
              <>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search name, SKU or vendor…"
                  className="w-full sm:w-[300px]"
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
                <MiniSelect
                  className="h-10"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </MiniSelect>
              </>
            }
            right={
              <>
                <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
                  Filters
                </Button>
                {can(P.STOCK_MANAGE) ? (
                  <>
                    <Button
                      variant="secondary"
                      className="text-brand-600"
                      leftIcon={<ShoppingCart className="h-4 w-4" />}
                      onClick={() => {
                        toast.info("Reorder draft created", "Check the Order Stock tab");
                        refetchOrders();
                      }}
                    >
                      Order Stock
                    </Button>
                    <Button leftIcon={<PackagePlus className="h-4 w-4" />} onClick={form.open}>
                      New Product
                    </Button>
                  </>
                ) : null}
              </>
            }
          />

          <DataTable
            columns={inventoryColumns}
            rows={stocks}
            loading={loading}
            emptyTitle="No products"
            emptyDescription="Add the consumables and medicines the clinic keeps."
          />
        </TabsContent>

        <TabsContent value="orders" className="pt-5">
          <Toolbar
            className="mb-4"
            left={
              <span className="text-[13px] text-ink-muted">
                {orders.filter((item) => item.status === "DRAFT").length} draft ·{" "}
                {orders.filter((item) => item.status === "SUBMITTED").length} submitted
              </span>
            }
            right={
              can(P.STOCK_MANAGE) ? (
                <Button
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                  onClick={() => toast.success("Orders submitted to purchasing")}
                >
                  Submit drafts
                </Button>
              ) : null
            }
          />

          <DataTable
            columns={orderColumns}
            rows={orders}
            emptyTitle="No reorder requests"
            emptyDescription="Requests raised from the inventory tab appear here."
          />
        </TabsContent>
      </Tabs>

      <StockFormModal open={form.isOpen} onClose={closeForm} onSaved={reloadAll} />
      <ConsumeModal
        open={consume.isOpen}
        onClose={consume.close}
        stock={consuming}
        onSaved={reloadAll}
      />
    </div>
  );
}
