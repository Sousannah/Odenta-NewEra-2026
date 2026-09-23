import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { REVIEW_STATUS } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { PageHeader } from "@/components/shared";
import { SignatureManager, SignatureMark } from "./SignatureManager";

/**
 * Signature management, given its own screen rather than a dialog.
 *
 * In the original this lived behind a button on the dashboard, which made it
 * something you set up once and never looked at again. It is worth a page: a
 * supervisor should be able to see what their mark looks like and which
 * sign-offs are carrying it without opening a review.
 */
export default function SignaturePage() {
  const { user } = useOutletContext() ?? {};

  const { data: reviews = [], loading } = useAsync(
    () => universityService.getReviews({ supervisorId: user?.staffId ?? "all" }),
    [user?.staffId],
    []
  );

  /* Refetched on save so the list below reflects the mark actually on file
     rather than the one this browser last drew. */
  const { data: signature, refetch: refetchSignature } = useAsync(
    () => universityService.getSignature(),
    []
  );

  const signed = useMemo(
    () =>
      reviews
        .filter((item) => item.status === REVIEW_STATUS.ACCEPTED && item.decidedAt)
        .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt))),
    [reviews]
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="My signature"
        description="The mark attached to every step you accept, and the sign-offs carrying it."
      />

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Sign-off signature" subtitle="Type it or draw it — both are stored the same way" />
          <CardBody className="pt-2">
            <SignatureManager onSaved={refetchSignature} />
          </CardBody>
        </Card>

        <div className="col-span-12 flex flex-col gap-5 xl:col-span-7">
          <InfoBanner tone="neutral" icon={<ShieldCheck className="h-4 w-4" />}>
            Your signature is held against your account and applied by the server when you accept a
            step. It never travels in a request from this browser, so it cannot be attached to
            somebody else's decision.
          </InfoBanner>

          <Card>
            <CardHeader
              title="Steps signed"
              subtitle={`${signed.length} step(s) accepted under your signature`}
            />
            <CardBody className="pt-2">
              {loading ? null : signed.length === 0 ? (
                <EmptyState
                  icon={<BadgeCheck className="h-6 w-6" />}
                  title="Nothing signed yet"
                  description="Accepted steps appear here with the date you signed them."
                  className="py-10"
                />
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {signed.slice(0, 12).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">
                          {item.procedureType}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {item.studentName} · {item.patientName} ·{" "}
                          {formatDate(item.decidedAt, "d MMM yyyy")}
                        </span>
                      </span>
                      <span className="flex h-9 shrink-0 items-center">
                        {/* The server stores a reference to the signature, not a
                            copy of it, so what is drawn here is the mark
                            currently on file — see the note below the list. */}
                        <SignatureMark
                          value={item.signatureRef ? signature?.signature : null}
                          className="max-h-9 text-[16px]"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {signed.length ? (
                <p className="mt-3 text-[11.5px] text-ink-faint">
                  Sign-offs reference your signature rather than storing a copy, so these show the
                  mark currently on file. Changing it changes what appears here.
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
