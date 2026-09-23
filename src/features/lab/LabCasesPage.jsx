import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { differenceInCalendarDays } from "date-fns";
import { AlarmClock, FlaskConical, Plus, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService, labService, patientService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { LAB_CASE_STAGES, LAB_CASE_TYPES, SHADE_GUIDE } from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, MiniSelect, Select, Textarea } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/Misc";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import { formatTeeth } from "@/components/dental";
import { app } from "@/config/paths";

const STAGE_ORDER = ["impression", "sent", "in_production", "try_in", "returned", "fitted"];

function LabCaseModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { data: patients = [] } = useAsync(() => patientService.getPatients({ status: "all" }), [], []);
  const { data: dentists = [] } = useAsync(() => clinicService.getDentists(), [], []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New lab case"
      description="Work order sent to the technician — shade, material and due date."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            loading={saving}
            onClick={() => {
              setSaving(true);
              setTimeout(() => {
                setSaving(false);
                toast.success("Lab case created");
                onSaved?.();
                onClose();
              }, 300);
            }}
          >
            Create case
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient" required>
            <Select defaultValue={patients[0]?.id}>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prescribing dentist">
            <Select defaultValue={dentists[0]?.id}>
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Appliance type">
            <Select defaultValue={LAB_CASE_TYPES[0]}>
              {LAB_CASE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Shade">
            <Select defaultValue="A2">
              {SHADE_GUIDE.map((shade) => (
                <option key={shade}>{shade}</option>
              ))}
            </Select>
          </Field>
          <Field label="Teeth" hint="FDI, comma separated">
            <Input placeholder="11, 12, 21" />
          </Field>
          <Field label="Material">
            <Input placeholder="Zirconia" />
          </Field>
          <Field label="Due date">
            <Input type="date" />
          </Field>
          <Field label="Estimated cost (USD)">
            <Input type="number" defaultValue={0} />
          </Field>
        </div>
        <Field label="Instructions to technician">
          <Textarea rows={3} placeholder="Occlusal clearance, contact tightness, aesthetics…" />
        </Field>
      </div>
    </Modal>
  );
}

/**
 * Lab case queue — shared by the dentist who prescribed the work and the
 * technician who makes it.
 */
export default function LabCasesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [stage, setStage] = useState("all");
  const [query, setQuery] = useState("");

  const form = useDisclosure(params.get("new") === "1");

  const { data: cases = [], loading, refetch } = useAsync(
    () => labService.getLabCases({ stage, q: query }),
    [stage, query],
    []
  );

  const closeForm = () => {
    form.close();
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const advance = async (item) => {
    const index = STAGE_ORDER.indexOf(item.stage);
    const next = index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null;
    if (!next) return;
    await labService.advanceLabCase(item.id, next);
    toast.success(`${item.id} moved on`, LAB_CASE_STAGES.find((s) => s.value === next)?.label);
    refetch();
  };

  /**
   * The three tiles, from the server.
   *
   * They were `cases.filter(...).length` over the fetched array. That was
   * merely expensive while the endpoint returned every case; it became *wrong*
   * once the endpoint was continuation-paged, because a practice with more than
   * a page of lab work would see tiles describing the first fifty rows and
   * presenting them as the practice's totals. It fails in the direction of
   * looking entirely plausible, which is the worst kind.
   *
   * `/lab/cases/stages` is two single-partition aggregates. It is also
   * unaffected by the stage tab and the search box, so it is fetched once
   * rather than on every keystroke.
   */
  const { data: stageCounts = {} } = useAsync(() => labService.getLabStageCounts(), [], {});

  const columns = [
    { key: "id", header: "Case", sortable: true, render: (row) => <b>#{row.id}</b> },
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(app.patient(row.patientId));
          }}
          className="text-[13.5px] font-semibold text-brand-700 hover:underline"
        >
          {row.patientName}
        </button>
      ),
    },
    {
      key: "type",
      header: "Appliance",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-ink">{row.type}</span>
          <span className="block text-[12px] text-ink-soft">
            {row.material}
            {row.teeth?.length ? ` · ${formatTeeth(row.teeth)}` : ""}
          </span>
        </span>
      ),
    },
    { key: "shade", header: "Shade", align: "center", render: (row) => row.shade ?? "—" },
    { key: "labName", header: "Lab" },
    {
      key: "dueAt",
      header: "Due",
      sortable: true,
      render: (row) => {
        const days = differenceInCalendarDays(new Date(row.dueAt), new Date());
        const late = days < 0 && row.stage !== "fitted";
        return (
          <span className="block">
            <span className={cn("block text-[13px] font-semibold", late ? "text-danger" : "text-ink")}>
              {formatDate(row.dueAt, "d MMM yyyy")}
            </span>
            <span className="block text-[11.5px] text-ink-soft">
              {late ? `${Math.abs(days)} day(s) late` : `in ${days} day(s)`}
            </span>
          </span>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (row) => {
        const meta = LAB_CASE_STAGES.find((item) => item.value === row.stage);
        return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? row.stage}</Badge>;
      },
    },
    {
      key: "cost",
      header: "Cost",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.cost)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        can(P.LAB_CASE_MANAGE) && row.stage !== "fitted" ? (
          <Button
            variant="secondary"
            size="xs"
            onClick={(event) => {
              event.stopPropagation();
              advance(row);
            }}
          >
            Advance
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Lab cases"
        description="Prosthetic work orders from impression through to fit."
        actions={
          can(P.LAB_CASE_MANAGE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
              New lab case
            </Button>
          ) : null
        }
      />

      <StatGrid cols={3}>
        <StatCard
          label="Open cases"
          value={stageCounts.open ?? 0}
          icon={<FlaskConical className="h-5 w-5" />}
        />
        <StatCard
          label="Overdue" value={stageCounts.overdue ?? 0} tone="danger"
          icon={<AlarmClock className="h-5 w-5" />}
        />
        <StatCard
          label="Remakes" value={stageCounts.remake ?? 0} tone="warning"
          icon={<RefreshCcw className="h-5 w-5" />}
        />
      </StatGrid>

      <Tabs value={stage} onValueChange={setStage}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {LAB_CASE_STAGES.filter((item) => item.value !== "impression").map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={stage} className="pt-5">
          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search case, patient or lab…"
                className="w-full sm:w-[320px]"
              />
            }
            right={
              <MiniSelect className="h-10" defaultValue="due">
                <option value="due">Sort by due date</option>
                <option value="created">Sort by created</option>
              </MiniSelect>
            }
          />

          <DataTable
            columns={columns}
            rows={cases}
            loading={loading}
            emptyTitle="No lab cases"
            emptyDescription="Cases appear here once an impression is taken."
          />
        </TabsContent>
      </Tabs>

      <LabCaseModal open={form.isOpen} onClose={closeForm} onSaved={refetch} />
    </div>
  );
}
