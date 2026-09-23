import { useState } from "react";
import { Filter, Mail, MoreVertical, Phone, Stethoscope, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput } from "@/components/ui/Misc";
import { Toolbar, toneFor } from "@/components/shared";
import { StaffWizard } from "./StaffWizard";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const WEEK_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WorkingDays({ days = [] }) {
  return (
    <div className="flex gap-1">
      {WEEK_KEYS.map((key, index) => {
        const on = days.includes(key);
        return (
          <span
            key={`${key}-${index}`}
            title={key}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
              on ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-faint"
            )}
          >
            {WEEK[index]}
          </span>
        );
      })}
    </div>
  );
}

export default function StaffPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can(P.STAFF_MANAGE);

  const [group, setGroup] = useState("dentist");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const wizard = useDisclosure();

  const { data: staff = [], loading, refetch } = useAsync(
    () => clinicService.getStaff({ group, q: query }),
    [group, query],
    []
  );

  const openWizard = (member = null) => {
    setSelected(member);
    wizard.open();
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
            <span className="block truncate text-[12px] text-ink-soft">{row.speciality}</span>
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <span className="flex flex-col gap-1 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <Phone className="h-3.5 w-3.5 text-ink-faint" />
            {row.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-ink-faint" />
            <a href={`mailto:${row.email}`} className="text-brand-600 hover:underline">
              {row.email}
            </a>
          </span>
        </span>
      ),
    },
    {
      key: "workingDays",
      header: "Working days",
      render: (row) => <WorkingDays days={row.workingDays} />,
    },
    {
      key: "services",
      header: "Assigned treatment",
      render: (row) => {
        const all = [...(row.services ?? []), ...(row.cosmetics ?? [])];
        if (!all.length) return <span className="text-ink-faint">—</span>;
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] text-ink-muted">{all.slice(0, 2).join(", ")}</span>
            {all.length > 2 ? (
              <span className="text-[12px] font-bold text-brand-600">+{all.length - 2}</span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "employment",
      header: "Type",
      render: (row) => <Badge tone={toneFor(row.employment)}>{row.employment}</Badge>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) => (
              <Dropdown
                items={[
                  { value: "edit", label: "Edit member" },
                  { value: "rota", label: "Adjust rota" },
                  { value: "deactivate", label: "Deactivate", tone: "danger" },
                ]}
                onSelect={(value) => {
                  if (value === "edit") openWizard(row);
                  else if (value === "rota") openWizard(row);
                  else toast.error(`${row.name} deactivated`);
                }}
                trigger={
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </span>
                }
              />
            ),
          },
        ]
      : []),
  ];

  const total = staff.length;
  const label = group === "dentist" ? "Doctor" : group === "general" ? "Staff" : "Team member";

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <Tabs value={group} onValueChange={setGroup}>
        <TabsList className="pt-4">
          <TabsTrigger value="dentist">Doctor Staff</TabsTrigger>
          <TabsTrigger value="general">General Staff</TabsTrigger>
          <TabsTrigger value="all">Everyone</TabsTrigger>
        </TabsList>

        <TabsContent value={group} className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
                {group === "dentist" ? (
                  <Stethoscope className="h-[18px] w-[18px]" />
                ) : (
                  <Users className="h-[18px] w-[18px]" />
                )}
              </span>
              <span className="text-[22px] font-extrabold text-ink">{total}</span>
              <span className="text-[13px] text-ink-soft">{label}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
                Filters
              </Button>
              {canManage ? (
                <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => openWizard()}>
                  {group === "dentist" ? "Add Doctor" : "Add Staff"}
                </Button>
              ) : null}
            </div>
          </div>

          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search staff…"
                className="w-full sm:w-[320px]"
              />
            }
          />

          <DataTable
            columns={columns}
            rows={staff}
            loading={loading}
            onRowClick={canManage ? openWizard : undefined}
            emptyTitle="No staff members"
            emptyDescription="Invite your first team member to get started."
          />
        </TabsContent>
      </Tabs>

      <StaffWizard
        open={wizard.isOpen}
        onClose={wizard.close}
        member={selected}
        onSaved={refetch}
      />
    </div>
  );
}
