import { useState } from "react";
import { Download, Filter, Plus, UserSquare2 } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { clinicService } from "@/services";
import { formatDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Misc";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Toolbar } from "@/components/shared";
import { PatientFormModal } from "./PatientFormModal";
import { PatientDrawer } from "./PatientDrawer";

const columns = (onOpen) => [
  {
    key: "name",
    header: "Patient",
    sortable: true,
    render: (row) => (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(row);
        }}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <Avatar name={row.name} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink hover:text-brand-600">
            {row.name}
          </span>
          <span className="block truncate text-[12px] text-ink-soft">{row.id}</span>
        </span>
      </button>
    ),
  },
  { key: "email", header: "Email", sortable: true },
  { key: "phone", header: "Phone" },
  {
    key: "address",
    header: "Address",
    render: (row) => (
      <span className="line-clamp-1 max-w-[240px] text-[13px] text-ink-muted">{row.address}</span>
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
    header: "Last visited",
    sortable: true,
    render: (row) => formatDate(row.lastVisited, "dd MMM yyyy"),
  },
  {
    key: "treatments",
    header: "Treatment",
    render: (row) =>
      row.treatments?.length ? <Badge tone="brand">{row.treatments[0]}</Badge> : "—",
  },
];

export default function PatientsPage() {
  const [status, setStatus] = useState("active");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const form = useDisclosure();
  const detail = useDisclosure();

  const { data: patients = [], loading } = useAsync(
    () => clinicService.getPatients({ status, query }),
    [status, query],
    []
  );

  const openDetail = (patient) => {
    setSelected(patient);
    detail.open();
  };

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="pt-4">
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Patients</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="pt-5">
          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search name, email or phone…"
                className="w-[320px]"
              />
            }
            right={
              <>
                <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
                  Filters
                </Button>
                <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
                  Export
                </Button>
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setSelected(null);
                    form.open();
                  }}
                >
                  Add Patient
                </Button>
              </>
            }
          />

          <DataTable
            columns={columns(openDetail)}
            rows={patients}
            loading={loading}
            onRowClick={openDetail}
            emptyTitle="No patients found"
            emptyDescription="Add your first patient or adjust the search."
            emptyAction={
              <Button leftIcon={<UserSquare2 className="h-4 w-4" />} onClick={form.open}>
                Add Patient
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      <PatientFormModal open={form.isOpen} onClose={form.close} patient={selected} />

      <PatientDrawer
        open={detail.isOpen}
        onClose={detail.close}
        patient={selected}
        onEdit={() => {
          detail.close();
          form.open();
        }}
      />
    </div>
  );
}
