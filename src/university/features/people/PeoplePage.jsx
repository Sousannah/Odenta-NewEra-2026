import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { useAuth } from "@/auth/AuthContext";
import { UP } from "@/auth/permissions";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { ROLES, ROLE_META, UNIVERSITY_ROLE_ORDER } from "@/auth/roles";
import { ACADEMIC_YEARS, academicYearLabel } from "@/config/academic";
import { uni } from "@/config/paths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MiniSelect, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";

/**
 * Everybody attached to the campus, in one directory.
 *
 * Deliberately separate from the IT accounts screen: this is the human
 * directory, that one is the credential store. A person can exist here with no
 * login, and an account can be disabled without removing the person — which is
 * why the Dean can correct a name or a rotation here and cannot reset a
 * password, and the IT administrator can do the reverse.
 */

const STATUSES = ["active", "probation", "suspended", "graduated"];

/** The sub-line under a name — composed here, from whichever fields exist. */
const subtitleFor = (person) => {
  if (person.role === ROLES.UNI_STUDENT) {
    return [person.group, person.academicYear ? academicYearLabel(person.academicYear) : null]
      .filter(Boolean)
      .join(" · ");
  }
  return [person.title, person.department].filter(Boolean).join(" · ");
};

export default function PeoplePage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [editing, setEditing] = useState(null);

  const canManage = can(UP.PEOPLE_MANAGE);

  const {
    data: rows = [],
    loading,
    refetch,
  } = useAsync(() => universityService.getPeople({ q: query, role }), [query, role], []);

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={item.name} size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{item.name}</span>
            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
              {subtitleFor(item)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (item) => (
        <Badge tone={ROLE_META[item.role]?.tone ?? "neutral"}>
          {ROLE_META[item.role]?.label ?? item.role}
        </Badge>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-[12.5px] font-semibold text-ink-muted">
          {item.reference ?? "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Contact",
      render: (item) => (
        <div className="min-w-0 text-[12.5px] text-ink-muted">
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {item.email}
          </span>
          {item.phone ? (
            <span className="mt-0.5 flex items-center gap-1.5 truncate">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {item.phone}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      sortable: true,
      render: (item) => (
        <span className="text-[13px] text-ink-muted">
          {item.joinedAt ? formatDate(item.joinedAt, "MMM yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => (
        <Badge
          tone={
            item.status === "probation" || item.status === "suspended"
              ? "danger"
              : item.status === "graduated"
                ? "neutral"
                : "success"
          }
        >
          {item.status ? item.status[0].toUpperCase() + item.status.slice(1) : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.role === ROLES.UNI_STUDENT ? (
            <Button variant="secondary" size="xs" onClick={() => navigate(uni.student(item.id))}>
              Open record
            </Button>
          ) : null}
          {canManage ? (
            <Button
              variant="ghost"
              size="xs"
              aria-label={`Edit ${item.name}`}
              onClick={() => setEditing(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="People"
        description="Students and staff members attached to the teaching clinic."
      />

      <StatGrid cols={4}>
        <StatCard
          label="People" value={rows.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Students" value={rows.filter((item) => item.role === ROLES.UNI_STUDENT).length} tone="success"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Staff members" value={rows.filter((item) => item.role === ROLES.UNI_SUPERVISOR).length}
          icon={<Stethoscope className="h-5 w-5" />}
        />
        <StatCard
          label="Not in good standing" value={rows.filter((item) => ["probation", "suspended"].includes(item.status)).length} tone="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Name, email or reference…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <MiniSelect value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Every role</option>
            {UNIVERSITY_ROLE_ORDER.map((value) => (
              <option key={value} value={value}>
                {ROLE_META[value].label}
              </option>
            ))}
          </MiniSelect>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle="Nobody matches"
        emptyDescription="Try clearing the search or the role filter."
      />

      <EditPersonModal
        person={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          toast.success("Saved", saved.name);
          setEditing(null);
          refetch();
        }}
      />
    </div>
  );
}

/**
 * Correcting a roster record.
 *
 * The fields offered are the ones the server will accept, per roster, and
 * nothing else. That is not only about failing cleanly — the fields that are
 * *absent* are the point:
 *
 *   - no tallies. `progress`, `acceptedSteps` and `averageScore` are folds over
 *     accepted work, and a settable progress ring is a number somebody typed.
 *   - no account link. Moving a person onto a different login is an account
 *     change, and it belongs to the IT administrator's screen.
 *
 * Only the fields that actually changed are sent, so an edit to a phone number
 * cannot accidentally re-assert a supervisor the Dean never touched.
 */
function EditPersonModal({ person, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /* Seed the form the first time a person is opened, and reset between them. */
  const current = person?.id;
  const [seeded, setSeeded] = useState(null);
  if (current && seeded !== current) {
    setSeeded(current);
    setForm({
      name: person.name ?? "",
      email: person.email ?? "",
      phone: person.phone ?? "",
      title: person.title ?? "",
      department: person.department ?? "",
      group: person.group ?? "",
      academicYear: person.academicYear ?? "",
      status: person.status ?? "active",
    });
    setError(null);
  }

  if (!person || !form) return null;

  const isStudent = person.role === ROLES.UNI_STUDENT;
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  /** Only what moved. An unchanged field is not a field worth sending. */
  const changes = () =>
    Object.fromEntries(
      Object.entries(form).filter(([field, value]) => {
        if (!isStudent && ["group", "academicYear"].includes(field)) return false;
        if (isStudent && ["title", "department"].includes(field)) return false;
        return value !== (person[field] ?? "");
      })
    );

  const save = async () => {
    const payload = changes();
    if (!Object.keys(payload).length) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await universityService.updatePerson(person.id, payload);
      onSaved(saved);
    } catch (cause) {
      setError(cause?.message ?? "Could not save this person");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={person.name}
      description={`${ROLE_META[person.role]?.label ?? person.role} · ${person.reference ?? person.id}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <Input value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set("phone")} />
        </Field>

        {isStudent ? (
          <>
            <Field label="Group">
              <Input value={form.group} onChange={set("group")} />
            </Field>
            <Field label="Year">
              <Select value={form.academicYear} onChange={set("academicYear")}>
                {ACADEMIC_YEARS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Title">
              <Input value={form.title} onChange={set("title")} />
            </Field>
            <Field label="Department">
              <Input value={form.department} onChange={set("department")} />
            </Field>
          </>
        )}

        <Field
          label="Standing"
          hint="Suspending somebody stops them working in clinic; it does not remove their record."
          className="sm:col-span-2"
        >
          <Select value={form.status} onChange={set("status")}>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
