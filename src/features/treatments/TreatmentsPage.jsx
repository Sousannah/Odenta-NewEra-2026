import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, LayoutGrid, List, Plus, Star, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { clinicService } from "@/services";
import { formatMoney } from "@/lib/format";
import { PROCEDURE_CATEGORIES } from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { MiniSelect } from "@/components/ui/Field";
import { Toolbar } from "@/components/shared";
import { TreatmentFormModal } from "./TreatmentFormModal";

const CATEGORY_TONE = {
  Diagnostic: "info",
  Preventive: "success",
  Restorative: "brand",
  Endodontics: "warning",
  Periodontics: "info",
  Prosthodontics: "warning",
  "Oral Surgery": "danger",
  Orthodontics: "brand",
  Cosmetic: "danger",
};

function TreatmentCard({ treatment, onEdit, canManage }) {
  return (
    <article className="od-card gap-3 p-5 transition hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={CATEGORY_TONE[treatment.category] ?? "neutral"}>{treatment.category}</Badge>
          {treatment.sample ? <Badge tone="neutral">Sample</Badge> : null}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-bold text-ink">{treatment.name}</h3>
          <code className="text-[11px] font-bold text-ink-soft">{treatment.code}</code>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{treatment.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> ± {treatment.duration} hour(s)
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {treatment.rating}
        </span>
        <span>
          {treatment.visits?.length ?? 1} visit{(treatment.visits?.length ?? 1) === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[17px] font-extrabold text-ink">{formatMoney(treatment.price)}</span>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={() => onEdit(treatment)}>
            Edit
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function TreatmentsPage() {
  const { can } = useAuth();
  const canManage = can(P.TREATMENT_MANAGE);
  const [params, setParams] = useSearchParams();

  const [active, setActive] = useState("true");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  const form = useDisclosure(params.get("new") === "1");

  const { data: treatments = [], loading, refetch } = useAsync(
    () => clinicService.getTreatments({ active, category, q: query }),
    [active, category, query],
    []
  );

  const openForm = (treatment = null) => {
    setSelected(treatment);
    form.open();
  };

  const closeForm = () => {
    form.close();
    setSelected(null);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Treatment name",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-bold text-ink">{row.name}</span>
            {row.sample ? <Badge tone="neutral">Sample</Badge> : null}
          </span>
          <span className="line-clamp-1 text-[12px] text-ink-soft">{row.description}</span>
        </span>
      ),
    },
    { key: "code", header: "Code", render: (row) => <code className="text-[12px]">{row.code}</code> },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="text-[13px] text-ink-muted">
          Start from <b className="text-ink">{formatMoney(row.price)}</b>
        </span>
      ),
    },
    {
      key: "duration",
      header: "Estimate duration",
      sortable: true,
      render: (row) => `± ${row.duration} hour(s)`,
    },
    {
      key: "visits",
      header: "Visits",
      align: "center",
      sortValue: (row) => row.visits?.length ?? 1,
      render: (row) => row.visits?.length ?? 1,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => <Badge tone={CATEGORY_TONE[row.category] ?? "neutral"}>{row.category}</Badge>,
    },
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
  ];

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="pt-4">
          <TabsTrigger value="true">Active Treatment</TabsTrigger>
          <TabsTrigger value="false">Inactive Treatment</TabsTrigger>
        </TabsList>

        <TabsContent value={active} className="pt-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
              <Stethoscope className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[22px] font-extrabold text-ink">{treatments.length}</span>
            <span className="text-[13px] text-ink-soft">treatments</span>
          </div>

          <Toolbar
            className="mb-4"
            left={
              <>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search treatment or code…"
                  className="w-full sm:w-[300px]"
                />
                <MiniSelect
                  className="h-10"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {PROCEDURE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </MiniSelect>
              </>
            }
            right={
              <>
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
                        view === id
                          ? "bg-brand-50 text-brand-600"
                          : "bg-white text-ink-soft hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                {canManage ? (
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
                    Add Treatment
                  </Button>
                ) : null}
              </>
            }
          />

          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {treatments.map((treatment) => (
                <TreatmentCard
                  key={treatment.id}
                  treatment={treatment}
                  onEdit={openForm}
                  canManage={canManage}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={treatments}
              loading={loading}
              onRowClick={canManage ? openForm : undefined}
              emptyTitle="No treatments"
              emptyDescription="Create the treatments your clinic offers."
            />
          )}
        </TabsContent>
      </Tabs>

      <TreatmentFormModal
        open={form.isOpen}
        onClose={closeForm}
        treatment={selected}
        onSaved={refetch}
      />
    </div>
  );
}
