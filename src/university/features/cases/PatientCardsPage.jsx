import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Hash,
  IdCard,
  Phone,
  Printer,
  Share2,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { DEPARTMENTS, departmentMeta } from "@/config/academic";
import { formatDate } from "@/lib/format";
import { site, uni } from "@/config/paths";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { Pagination, SearchInput } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { QrCode } from "@/components/ui/QrCode";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Toolbar, StatCard, StatGrid, toneFor, labelFor } from "@/components/shared";
import { DetailGrid, PatientCard } from "@/university/components";
import { ShareCardModal } from "./ShareCardModal";

/**
 * Patient cards.
 *
 * The card is what a patient carries between visits; it is also what a student
 * pins to their tray. Printing is a browser print of this grid — the card
 * layout is deliberately fixed-width so a page of them lands on A4 cleanly.
 *
 * Opening one shows the card face plus the visit history behind it, which is
 * the question the card itself cannot answer: has this person actually been
 * turning up.
 */

const PER_PAGE = 12;

/** The visit history behind one card. Fetched only once a card is opened. */
function VisitHistory({ caseId }) {
  const { data: visits = [], loading } = useAsync(
    () => (caseId ? universityService.getCaseAppointments(caseId) : []),
    [caseId],
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!visits.length) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-6 w-6" />}
        title="No appointments recorded"
        description="Nothing has been booked against this card yet."
        className="py-8"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {visits.map((visit) => (
        <li
          key={visit.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-ink">
                {departmentMeta(visit.department).label}
              </span>
              <span className="block truncate text-[12px] text-ink-soft">
                {formatDate(visit.date, "EEE, d MMM yyyy")} · {visit.time}
              </span>
            </span>
          </span>
          <Badge tone={toneFor(visit.status)}>{labelFor(visit.status)}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** The card's own public link, which is also what its QR encodes. */
const shareUrlFor = (item) => {
  if (!item?.shareToken) return null;
  const path = site.card(item.shareToken);
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
};

export default function PatientCardsPage() {
  const { campus, user, role } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const { can } = useAuth();
  const isStudent = role === ROLES.UNI_STUDENT;

  /**
   * The clinic desk holds the cards but not the records behind them, so the
   * button that opens one is gated on the same permission as the route. It
   * used to be shown to everybody and sent the desk to a "you do not have
   * access to this screen" page — an offer the product could not keep.
   */
  const canOpenRecord = can(UP.CASE_VIEW_OWN);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [issued, setIssued] = useState("all");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState(null);
  const [sharing, setSharing] = useState(null);

  const scope = useMemo(
    () => (isStudent ? { studentId: user?.staffId ?? "all" } : {}),
    [isStudent, user?.staffId]
  );

  const { data: rows = [], loading } = useAsync(
    () => universityService.getCases({ ...scope, q: query, department }),
    [scope, query, department],
    []
  );

  const filtered = useMemo(() => {
    if (issued === "issued") return rows.filter((item) => item.cardIssued);
    if (issued === "pending") return rows.filter((item) => !item.cardIssued);
    return rows;
  }, [rows, issued]);

  const pageCount = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Patient cards"
        description="The card each patient carries between visits. Every card carries a QR that opens it."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Print this page
          </Button>
        }
      />

      <StatGrid cols={3}>
        <StatCard
          label="Cards" value={rows.length}
          icon={<IdCard className="h-5 w-5" />}
        />
        <StatCard
          label="Issued" value={rows.filter((item) => item.cardIssued).length} tone="success"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Not yet issued" value={rows.filter((item) => !item.cardIssued).length} tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Patient, national ID or card number…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect
              value={issued}
              onChange={(event) => {
                setIssued(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Issued or not</option>
              <option value="issued">Issued</option>
              <option value="pending">Not issued</option>
            </MiniSelect>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No cards match"
          description="Try clearing the search or widening the rotation filter."
          className="od-card py-16"
        />
      ) : (
        <>
          {/* `items-stretch` plus `h-full` on the card is what makes every
              cell the same height — a grid row is as tall as its tallest
              child, and without this each card shrank to its own content. */}
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((item) => (
              <div key={item.id} className="relative flex">
                <button
                  type="button"
                  onClick={() => setOpened(item)}
                  className="od-focus flex w-full rounded-2xl text-left transition hover:-translate-y-0.5"
                >
                  <PatientCard item={item} campus={campus} shareUrl={shareUrlFor(item)} />
                </button>
                <button
                  type="button"
                  aria-label={`Share ${item.patientName}'s card`}
                  onClick={() => setSharing(item)}
                  className="od-focus absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/30 print:hidden"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <Pagination
              page={current}
              pageCount={pageCount}
              total={filtered.length}
              onChange={setPage}
            />
          ) : null}
        </>
      )}

      {/* --------------------------------------------------- the card, opened */}
      <Modal
        open={Boolean(opened)}
        onClose={() => setOpened(null)}
        title={opened?.patientName}
        description="Patient identification card"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpened(null)}>
              Close
            </Button>
            <Button
              variant={canOpenRecord ? "secondary" : "primary"}
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={() => {
                setSharing(opened);
                setOpened(null);
              }}
            >
              Share the card
            </Button>
            {canOpenRecord ? (
              <Button
                onClick={() => {
                  const target = opened;
                  setOpened(null);
                  if (target) navigate(uni.patientTab(target.nationalId, "medical"));
                }}
              >
                Open record
              </Button>
            ) : null}
          </>
        }
      >
        {opened ? (
          <div className="flex flex-col gap-5">
            <div className="od-gradient flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-extrabold">{opened.patientName}</p>
                <p className="truncate text-[12px] font-semibold text-white/80">
                  {campus?.shortName ?? "AIU"} Dental Clinic ·{" "}
                  {departmentMeta(opened.department).label}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] font-extrabold">
                {opened.cardNumber ?? "NOT ISSUED"}
              </span>
            </div>

            {/* The QR is the card's own link, so the dialog is also how the
                desk hands it over with the patient standing there. */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:gap-5">
              <QrCode
                value={shareUrlFor(opened)}
                size={112}
                title={`Card for ${opened.patientName}`}
                className="shrink-0 border border-slate-200"
              />
              <p className="text-center text-[12.5px] leading-relaxed text-ink-muted sm:text-left">
                Point a camera at this to open the card — identity, the allocated student and
                upcoming visits. It carries nothing clinical, so it is safe to hand to the
                patient or forward to another clinic.
              </p>
            </div>

            <DetailGrid
              columns={2}
              items={[
                {
                  label: "Serial number",
                  value: (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      {opened.serialNumber ?? "—"}
                    </span>
                  ),
                },
                {
                  label: "National ID",
                  value: (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <IdCard className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      {opened.nationalId}
                    </span>
                  ),
                },
                {
                  label: "Phone",
                  value: (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      {opened.phone ?? "—"}
                    </span>
                  ),
                },
                { label: "Age / gender", value: `${opened.age} · ${opened.gender}` },
                {
                  label: "Allocated student",
                  value: opened.studentName ?? "Unallocated",
                },
                { label: "Student ID", value: opened.studentNumber ?? "—" },
                { label: "Clinic", value: opened.chair ?? "—" },
              ]}
            />

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Appointment history</h4>
              <VisitHistory caseId={opened.id} />
            </section>
          </div>
        ) : null}
      </Modal>

      <ShareCardModal
        item={sharing}
        campus={campus}
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
      />
    </div>
  );
}
