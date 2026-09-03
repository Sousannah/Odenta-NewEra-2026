import { useState } from "react";
import { Clock, LayoutGrid, List, Plus, Star, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { formatMoney } from "@/lib/format";
import { TREATMENT_CATEGORIES } from "@/config/domain";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { MiniSelect, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, Toolbar } from "@/components/shared";

const CATEGORY_TONE = {
  Medical: "brand",
  Cosmetic: "danger",
  Orthodontic: "info",
  Prosthodontic: "warning",
};

/* ------------------------------------------------------------ card view */

function TreatmentCard({ treatment, onEdit }) {
  return (
    <article className="od-card gap-3 p-5 transition hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Stethoscope className="h-5 w-5" />
        </span>
        <Badge tone={CATEGORY_TONE[treatment.category] ?? "neutral"}>{treatment.category}</Badge>
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-ink">{treatment.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{treatment.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> ± {treatment.duration} hour(s)
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {treatment.rating}
        </span>
        <span>{treatment.visits} visit(s)</span>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[17px] font-extrabold text-ink">{formatMoney(treatment.price)}</span>
        <Button variant="secondary" size="sm" onClick={() => onEdit(treatment)}>
          Edit
        </Button>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------- form modal */

function TreatmentFormModal({ open, onClose, treatment }) {
  const toast = useToast();
  const editing = Boolean(treatment);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit treatment" : "Create treatment"}
      description="Treatments drive scheduling duration, billing and stock consumption."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success(editing ? "Treatment updated" : "Treatment created");
              onClose();
            }}
          >
            {editing ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Treatment name" required>
          <Input defaultValue={treatment?.name ?? ""} placeholder="Tooth Scaling" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <Select defaultValue={treatment?.category ?? "Medical"}>
              {TREATMENT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (hours)">
            <Input type="number" step="0.5" defaultValue={treatment?.duration ?? 1} />
          </Field>
          <Field label="Visits">
            <Input type="number" defaultValue={treatment?.visits ?? 1} />
          </Field>
        </div>

        <Field label="Base price (USD)">
          <Input type="number" defaultValue={treatment?.price ?? 0} />
        </Field>

        <Field label="Description">
          <Textarea rows={3} defaultValue={treatment?.description ?? ""} />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

export default function TreatmentsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const form = useDisclosure();

  const { data: treatments = [], loading } = useAsync(
    () => clinicService.getTreatments({ category, query }),
    [category, query],
    []
  );

  const openForm = (treatment = null) => {
    setSelected(treatment);
    form.open();
  };

  const columns = [
    {
      key: "name",
      header: "Treatment",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-ink">{row.name}</span>
          <span className="line-clamp-1 text-[12px] text-ink-soft">{row.description}</span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => <Badge tone={CATEGORY_TONE[row.category] ?? "neutral"}>{row.category}</Badge>,
    },
    { key: "duration", header: "Duration", render: (row) => `± ${row.duration} hour(s)` },
    { key: "visits", header: "Visits", align: "center" },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {row.rating}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.price)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Treatments"
        description="Create customized treatments and keep pricing consistent across the clinic."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
            New treatment
          </Button>
        }
      />

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search treatment…"
              className="w-[300px]"
            />
            <MiniSelect
              className="h-10"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {TREATMENT_CATEGORIES.map((item) => (
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
          {treatments.map((treatment) => (
            <TreatmentCard key={treatment.id} treatment={treatment} onEdit={openForm} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={treatments}
          loading={loading}
          onRowClick={openForm}
          emptyTitle="No treatments"
        />
      )}

      <TreatmentFormModal open={form.isOpen} onClose={form.close} treatment={selected} />
    </div>
  );
}
