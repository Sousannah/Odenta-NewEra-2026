import { useState } from "react";
import { Mail, Phone, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { PageHeader, Toolbar, toneFor } from "@/components/shared";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WorkingDays({ days = [] }) {
  return (
    <div className="flex gap-1">
      {WEEK.map((day) => {
        const on = days.includes(day);
        return (
          <span
            key={day}
            title={day}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold",
              on ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-ink-faint"
            )}
          >
            {day[0]}
          </span>
        );
      })}
    </div>
  );
}

function InviteModal({ open, onClose }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a team member"
      description="They receive an email invitation to join this clinic."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px]"
            onClick={() => {
              toast.success("Invitation sent");
              onClose();
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Full name" required>
          <Input placeholder="Drg Amara Voss" />
        </Field>
        <Field label="Email address" required>
          <Input type="email" placeholder="name@clinic.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <Select defaultValue="Dentist">
              {["Dentist", "Dental Assistant", "Front Office", "Lab Technician", "Super Admin"].map(
                (role) => (
                  <option key={role}>{role}</option>
                )
              )}
            </Select>
          </Field>
          <Field label="Employment">
            <Select defaultValue="FULL-TIME">
              <option>FULL-TIME</option>
              <option>PART-TIME</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default function StaffPage() {
  const [role, setRole] = useState("all");
  const [query, setQuery] = useState("");
  const invite = useDisclosure();

  const { data: staff = [], loading } = useAsync(
    () => clinicService.getStaff({ role, query }),
    [role, query],
    []
  );

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
        <span className="flex flex-col gap-1 text-[12.5px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-ink-faint" />
            {row.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-ink-faint" />
            {row.phone}
          </span>
        </span>
      ),
    },
    { key: "role", header: "Occupation", sortable: true },
    {
      key: "workingDays",
      header: "Working days",
      render: (row) => <WorkingDays days={row.workingDays} />,
    },
    {
      key: "treatments",
      header: "Assigned treatment",
      render: (row) =>
        row.treatments?.length ? (
          <span className="flex flex-wrap gap-1.5">
            {row.treatments.slice(0, 2).map((treatment) => (
              <Badge key={treatment} tone="brand">
                {treatment}
              </Badge>
            ))}
            {row.treatments.length > 2 ? (
              <Badge tone="neutral">+{row.treatments.length - 2}</Badge>
            ) : null}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "employment",
      header: "Type",
      render: (row) => <Badge tone={toneFor(row.employment)}>{row.employment}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      <Tabs value={role} onValueChange={setRole}>
        <TabsList className="pt-4">
          <TabsTrigger value="all">All Staff</TabsTrigger>
          <TabsTrigger value="dentist">Dentists</TabsTrigger>
          <TabsTrigger value="general">General Staff</TabsTrigger>
        </TabsList>

        <TabsContent value={role} className="pt-5">
          <PageHeader
            className="mb-4"
            title="Staff list"
            description="Plan schedules, coordinate tasks and keep workloads balanced."
            actions={
              <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={invite.open}>
                Invite member
              </Button>
            }
          />

          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search staff…"
                className="w-[300px]"
              />
            }
            right={
              <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />}>
                Add schedule
              </Button>
            }
          />

          <DataTable
            columns={columns}
            rows={staff}
            loading={loading}
            emptyTitle="No staff members"
          />
        </TabsContent>
      </Tabs>

      <InviteModal open={invite.isOpen} onClose={invite.close} />
    </div>
  );
}
