import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Filter, LayoutGrid, List, Mail, Phone, Plus, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { patientService } from "@/services";
import { formatDate } from "@/lib/format";
import { CARIES_RISK } from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Misc";
import { MiniSelect } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toolbar, PatientAlerts, toneFor } from "@/components/shared";
import { PatientFormModal } from "./PatientFormModal";
import { app } from "@/config/paths";

function PatientCard({ patient, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(patient)}
      className="od-card gap-3 p-5 text-left transition hover:shadow-pop"
    >
      <div className="flex items-start gap-3">
        <Avatar name={patient.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-bold text-ink">{patient.name}</div>
          <div className="truncate text-[12px] text-ink-soft">
            {patient.mrn} · {patient.gender}
          </div>
        </div>
        <Badge tone={toneFor(patient.cariesRisk)}>{patient.cariesRisk}</Badge>
      </div>

      <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-muted">
        <span className="flex items-center gap-2 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          {patient.email}
        </span>
        <span className="flex items-center gap-2 truncate">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          {patient.phone}
        </span>
      </div>

      {/**
       * Guarded on the field being *present*, not on it being truthy.
       *
       * The patient list row is the administrative half of the record and
       * deliberately carries no `alerts`, `allergies` or `asa` — those live in
       * the `records` container behind `patient_clinical:view`. So against the
       * live API all three are absent here, and passing the row straight in
       * makes `PatientAlerts` read it as an *unchecked history* and stamp an
       * amber warning on every card in the list.
       *
       * Three states, and conflating any two is a bug: entries present (show
       * the count), field present but empty or null (checked-and-clear, or
       * not-checked), field absent (this caller may not read the record — say
       * nothing).
       */}
      {"alerts" in patient ? <PatientAlerts patient={patient} compact /> : null}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
        <span className="text-ink-soft">Last visit {formatDate(patient.lastVisited, "d MMM yyyy")}</span>
        <span className="font-bold text-brand-600">Open record</span>
      </div>
    </button>
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();

  const [status, setStatus] = useState("active");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  const form = useDisclosure(params.get("new") === "1");

  const { data: patients = [], loading, refetch } = useAsync(
    () => patientService.getPatients({ status, q: query, risk }),
    [status, query, risk],
    [],
    /* The search text is part of the key: without it, typing a query and
       clearing it would show the filtered rows under "all". */
    { key: `clinic:patients:${status}:${risk}:${query}` }
  );

  const openPatient = (patient) => navigate(app.patient(patient.id));

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
      header: "Patient name",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-bold text-ink">{row.name}</span>
              {"alerts" in row ? <PatientAlerts patient={row} compact /> : null}
            </span>
            <span className="block truncate text-[12px] text-ink-soft">{row.mrn}</span>
          </span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
          <Phone className="h-3.5 w-3.5 text-ink-faint" />
          {row.phone}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
          <Mail className="h-3.5 w-3.5 text-ink-faint" />
          {row.email}
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (row) => (
        <span className="line-clamp-1 max-w-[220px] text-[13px] text-ink-muted">{row.address}</span>
      ),
    },
    {
      key: "registered",
      header: "Registered",
      sortable: true,
      render: (row) => formatDate(row.registered, "dd MMM yyyy"),
    },
    {
      key: "lastVisited",
      header: "Last visit",
      sortable: true,
      render: (row) => formatDate(row.lastVisited, "dd MMM yyyy"),
    },
    {
      key: "cariesRisk",
      header: "Caries risk",
      sortable: true,
      render: (row) => <Badge tone={toneFor(row.cariesRisk)}>{row.cariesRisk}</Badge>,
    },
    { key: "primaryDentist", header: "Primary dentist" },
  ];

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="pt-4">
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Patients</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="pt-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
              <UserSquare2 className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[22px] font-extrabold text-ink">{patients.length}</span>
            <span className="text-[13px] text-ink-soft">total patients</span>
          </div>

          <Toolbar
            className="mb-4"
            left={
              <>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search name, MRN, email or phone…"
                  className="w-full sm:w-[320px]"
                />
                <MiniSelect
                  className="h-10"
                  value={risk}
                  onChange={(event) => setRisk(event.target.value)}
                >
                  <option value="all">All caries risk</option>
                  {CARIES_RISK.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} risk
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
                <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
                  Export
                </Button>
                {can(P.PATIENT_CREATE) ? (
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
                    Add Patient
                  </Button>
                ) : null}
              </>
            }
          />

          {loading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} onOpen={openPatient} />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={patients}
              onRowClick={openPatient}
              emptyTitle="No patients found"
              emptyDescription="Add your first patient or adjust the search."
              emptyAction={
                can(P.PATIENT_CREATE) ? (
                  <Button leftIcon={<UserSquare2 className="h-4 w-4" />} onClick={form.open}>
                    Add Patient
                  </Button>
                ) : null
              }
            />
          )}
        </TabsContent>
      </Tabs>

      <PatientFormModal
        open={form.isOpen}
        onClose={closeForm}
        patient={selected}
        onSaved={refetch}
      />
    </div>
  );
}
