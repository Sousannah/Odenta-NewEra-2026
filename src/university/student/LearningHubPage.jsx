import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { BookOpen, ChevronDown, GraduationCap, Ruler, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { uni } from "@/config/paths";
import { DEPARTMENTS, SHEET_TYPES, departmentMeta } from "@/config/academic";
import {
  FURCATION_GRADES,
  ICDAS_CODES,
  MOBILITY_GRADES,
  PERIO_GRADES,
  PERIO_SITE_LABELS,
  PERIO_SITES,
  PERIO_STAGES,
  SHADE_GUIDE,
  SURFACES,
} from "@/config/dentalStandards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/Misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/shared";
import { DepartmentChip } from "@/university/components";

/**
 * The learning hub.
 *
 * Two things a student otherwise keeps on a phone photo of a printout: the
 * step sequence for each procedure, and the grading scales they are expected
 * to quote from memory. Both already exist in the app — the sheet definitions
 * and the clinical standards — so this surfaces them as reference rather than
 * as another copy that will drift.
 */

/**
 * VITA families as approximate swatches.
 *
 * A screen cannot be shade-matched against — the guide is held next to the
 * tooth, in daylight. These are here to make the list scannable, nothing more.
 */
const SHADE_FAMILIES = {
  A: { label: "A — reddish brown", hex: "#EFE0C8" },
  B: { label: "B — reddish yellow", hex: "#F3E6C4" },
  C: { label: "C — grey", hex: "#E4E2D8" },
  D: { label: "D — reddish grey", hex: "#EBE3D6" },
};

/* --------------------------------------------------------------- scales */

function ScaleTable({ rows, columns }) {
  return (
    <div className="od-scroll-x overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap border-b border-slate-200 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-2.5 align-top text-[13px] text-ink">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A scale whose whole definition fits in its label — no second column. */
function GradeList({ rows }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.value}
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-[12px] font-extrabold text-brand-700">
            {row.value}
          </span>
          <span className="text-[13px] font-semibold text-ink">{row.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ReferenceCard({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="od-focus flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-ink">{title}</span>
          {subtitle ? (
            <span className="block truncate text-[12.5px] text-ink-soft">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-soft transition", open && "rotate-180")} />
      </button>
      {open ? <CardBody className="border-t border-slate-100 pt-4">{children}</CardBody> : null}
    </Card>
  );
}

/* ------------------------------------------------------------ the screen */

export default function LearningHubPage() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const [tab, setTab] = useState("protocols");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const { data: student } = useAsync(
    () => (user?.staffId ? universityService.getStudent(user.staffId) : null),
    [user?.staffId]
  );

  /** The rotations the student still owes cases to, flagged in the list. */
  const outstanding = useMemo(() => {
    const set = new Set();
    (student?.requirements ?? []).forEach((entry) => {
      if (entry.completed < entry.required) set.add(entry.department);
    });
    return set;
  }, [student]);

  const sheets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SHEET_TYPES.filter((sheet) => {
      if (department !== "all" && sheet.department !== department) return false;
      if (!needle) return true;
      return (
        sheet.label.toLowerCase().includes(needle) ||
        sheet.sections.some(
          (section) =>
            section.label.toLowerCase().includes(needle) ||
            section.fields.some((field) => field.toLowerCase().includes(needle))
        )
      );
    });
  }, [query, department]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Learning hub"
        description="The sequences and scales you are examined on, drawn from the same definitions the clinic runs on."
        actions={
          <Button
            variant="secondary"
            leftIcon={<GraduationCap className="h-4 w-4" />}
            onClick={() => navigate(uni.requirements)}
          >
            My requirements
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="protocols" badge={SHEET_TYPES.length}>
            Clinical protocols
          </TabsTrigger>
          <TabsTrigger value="scales">Grading scales</TabsTrigger>
          <TabsTrigger value="notation">Notation &amp; shades</TabsTrigger>
        </TabsList>

        <div className="pt-4">
          {/* --------------------------------------------------- protocols */}
          <TabsContent value="protocols">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search a step, section or procedure…"
                className="w-full sm:w-[360px]"
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDepartment("all")}
                  className={cn(
                    "od-focus rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                    department === "all"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-ink-muted hover:bg-slate-200"
                  )}
                >
                  All
                </button>
                {DEPARTMENTS.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setDepartment(entry.key)}
                    className={cn(
                      "od-focus rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                      department === entry.key
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-ink-muted hover:bg-slate-200"
                    )}
                  >
                    {entry.short}
                  </button>
                ))}
              </div>
            </div>

            {sheets.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-6 w-6" />}
                title="Nothing matches"
                description="Try a different term, or clear the rotation filter."
                className="od-card py-16"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {sheets.map((sheet) => (
                  <Card key={sheet.value}>
                    <CardHeader
                      title={sheet.label}
                      subtitle={`${sheet.sections.length} sections · ${departmentMeta(sheet.department).label}`}
                      action={
                        <span className="flex items-center gap-2">
                          {outstanding.has(sheet.department) ? (
                            <Badge tone="warning">Quota outstanding</Badge>
                          ) : null}
                          <DepartmentChip department={sheet.department} short />
                        </span>
                      }
                    />
                    <CardBody className="pt-2">
                      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {sheet.sections.map((section, index) => (
                          <li
                            key={section.key}
                            className="rounded-2xl border border-slate-200 px-4 py-3.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-700">
                                {index + 1}
                              </span>
                              <span className="text-[13.5px] font-bold text-ink">
                                {section.label}
                              </span>
                            </div>
                            <ul className="mt-2.5 flex flex-wrap gap-1.5">
                              {section.fields.map((field) => (
                                <li
                                  key={field}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-ink-muted"
                                >
                                  {field}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------ scales */}
          <TabsContent value="scales">
            <div className="flex flex-col gap-4">
              <ReferenceCard
                title="ICDAS II — caries detection"
                subtitle="Codes 0 to 6, quoted on every operative diagnosis"
                defaultOpen
              >
                <ScaleTable
                  rows={ICDAS_CODES}
                  columns={[
                    {
                      key: "code",
                      header: "Code",
                      render: (row) => (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-700">
                          {row.code}
                        </span>
                      ),
                    },
                    {
                      key: "label",
                      header: "Finding",
                      render: (row) => <span className="font-semibold">{row.label}</span>,
                    },
                    { key: "detail", header: "How it presents" },
                  ]}
                />
              </ReferenceCard>

              <ReferenceCard
                title="Periodontal staging"
                subtitle="2017 world workshop — stage I to IV"
              >
                <ScaleTable
                  rows={PERIO_STAGES}
                  columns={[
                    {
                      key: "value",
                      header: "Stage",
                      render: (row) => <span className="font-bold">{row.label}</span>,
                    },
                    { key: "detail", header: "Definition" },
                  ]}
                />
              </ReferenceCard>

              <ReferenceCard title="Periodontal grading" subtitle="Rate of progression, A to C">
                <ScaleTable
                  rows={PERIO_GRADES}
                  columns={[
                    {
                      key: "value",
                      header: "Grade",
                      render: (row) => <span className="font-bold">{row.label}</span>,
                    },
                    { key: "detail", header: "Definition" },
                  ]}
                />
              </ReferenceCard>

              <ReferenceCard title="Mobility grades" subtitle="Miller classification">
                <GradeList rows={MOBILITY_GRADES} />
              </ReferenceCard>

              <ReferenceCard title="Furcation involvement" subtitle="Glickman classification">
                <GradeList rows={FURCATION_GRADES} />
              </ReferenceCard>
            </div>
          </TabsContent>

          {/* --------------------------------------------------- notation */}
          <TabsContent value="notation">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader
                  title="Tooth surfaces"
                  subtitle="Anteriors chart to incisal, posteriors to occlusal"
                />
                <CardBody className="pt-2">
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {Object.values(SURFACES).map((surface) => (
                      <li
                        key={surface.code}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-[12px] font-extrabold text-brand-700">
                          {surface.code}
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{surface.label}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Periodontal probing sites"
                  subtitle="Six per tooth, charted in this order"
                  action={
                    <Badge tone="neutral">
                      <Ruler className="h-3 w-3" />
                      {PERIO_SITES.length} sites
                    </Badge>
                  }
                />
                <CardBody className="pt-2">
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {PERIO_SITES.map((site, index) => (
                      <li
                        key={site}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-[11px] font-extrabold text-accent-700">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-ink">{site}</span>
                          <span className="block truncate text-[12px] text-ink-soft">
                            {PERIO_SITE_LABELS[site]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader
                  title="Shade guide"
                  subtitle="VITA classical — take the shade before the tooth dehydrates"
                  action={
                    <Badge tone="warning">
                      <Stethoscope className="h-3 w-3" />
                      Shade first, prep second
                    </Badge>
                  }
                />
                <CardBody className="pt-2">
                  <ul className="flex flex-wrap gap-2">
                    {SHADE_GUIDE.map((shade) => (
                      <li
                        key={shade}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                        title={`${SHADE_FAMILIES[shade[0]].label} · ${shade}`}
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: SHADE_FAMILIES[shade[0]].hex }}
                        />
                        <span className="text-[12.5px] font-bold text-ink">{shade}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
