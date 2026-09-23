import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Megaphone, Pin, Plus, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { ROLE_META, UNIVERSITY_ROLE_ORDER } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { MiniSelect } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar } from "@/components/shared";

const EMPTY = { title: "", body: "", audience: [], pinned: false };

/**
 * Announcements.
 *
 * Readers see published posts for their own role; an admin sees drafts too and
 * can publish. Audience is a list of roles rather than a single one because a
 * consent-policy change has to reach students *and* the desk.
 */
export default function AnnouncementsPage() {
  const { can, role, user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const canManage = can(UP.NEWS_MANAGE);
  const [status, setStatus] = useState(canManage ? "all" : "published");
  const [composing, setComposing] = useState(params.get("new") === "1");
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: rows = [], loading, refetch } = useAsync(
    () =>
      universityService.getNews(
        canManage ? { status } : { status: "published", audience: role }
      ),
    [canManage, status, role],
    []
  );

  useEffect(() => {
    if (!composing && params.get("new") === "1") {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [composing, params, setParams]);

  const publish = async (asDraft) => {
    if (!form.title.trim() || !form.body.trim()) {
      setError("A title and a body are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await universityService.publishNews({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience.length ? form.audience : ["uni_student"],
        pinned: form.pinned,
        author: user?.name ?? "Faculty",
        status: asDraft ? "draft" : "published",
        publishedAt: asDraft ? null : toDateKey(),
      });
      toast.success(asDraft ? "Saved as a draft" : "Announcement published", form.title);
      setForm(EMPTY);
      setComposing(false);
      refetch();
    } catch (cause) {
      setError(cause?.message ?? "Could not post this announcement");
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (item) => {
    await universityService.updateNews(item.id, { pinned: !item.pinned });
    refetch();
  };

  const publishDraft = async (item) => {
    await universityService.updateNews(item.id, { status: "published" });
    toast.success("Published", item.title);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Announcements"
        description={
          canManage
            ? "Post to the whole clinic, or to one role. Pinned posts stay at the top of every dashboard."
            : "Notices from the faculty and the clinic desk."
        }
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setComposing(true)}>
              New announcement
            </Button>
          ) : null
        }
      />

      {canManage ? (
        <Toolbar
          right={
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </MiniSelect>
          }
        />
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Nothing posted"
          description={canManage ? "Write the first announcement." : "Check back later."}
          className="od-card py-16"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((item) => (
            <Card
              key={item.id}
              className={cn(item.pinned && "border-brand-200 bg-brand-50/40")}
            >
              <CardHeader
                title={item.title}
                subtitle={`${item.author} · ${
                  item.publishedAt ? formatDate(item.publishedAt, "d MMMM yyyy") : "Not published"
                }`}
                action={
                  <div className="flex items-center gap-2">
                    {item.pinned ? (
                      <Badge tone="brand">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    ) : null}
                    <Badge tone={item.status === "published" ? "success" : "neutral"}>
                      {item.status}
                    </Badge>
                  </div>
                }
              />
              <CardBody className="pt-1">
                <p className="text-[13.5px] leading-relaxed text-ink-muted">{item.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.audience.map((value) => (
                    <span
                      key={value}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-ink-muted"
                    >
                      {ROLE_META[value]?.short ?? value}
                    </span>
                  ))}
                </div>

                {canManage ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <Button variant="secondary" size="xs" onClick={() => togglePin(item)}>
                      {item.pinned ? "Unpin" : "Pin to dashboards"}
                    </Button>
                    {item.status === "draft" ? (
                      <Button size="xs" onClick={() => publishDraft(item)}>
                        Publish
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={composing}
        onClose={() => setComposing(false)}
        title="New announcement"
        description="Everyone in the chosen roles sees this on their dashboard."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => publish(true)} loading={busy}>
              Save draft
            </Button>
            <Button onClick={() => publish(false)} loading={busy} leftIcon={<Send className="h-4 w-4" />}>
              Publish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Digital consent is now mandatory"
            />
          </Field>

          <Field label="Body" required>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="What changed, when it takes effect, and what people need to do."
            />
          </Field>

          <div>
            <span className="text-[13px] font-semibold text-ink">Who should see this</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {UNIVERSITY_ROLE_ORDER.map((value) => (
                <Checkbox
                  key={value}
                  label={ROLE_META[value].label}
                  checked={form.audience.includes(value)}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      audience: prev.audience.includes(value)
                        ? prev.audience.filter((entry) => entry !== value)
                        : [...prev.audience, value],
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <Checkbox
            label="Pin to the top of every dashboard"
            checked={form.pinned}
            onChange={() => setForm((prev) => ({ ...prev, pinned: !prev.pinned }))}
          />

          {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}
        </div>
      </Modal>
    </div>
  );
}
