import { useEffect, useState } from "react";
import { BookOpen, Clock, MessageSquarePlus, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, toneFor } from "@/components/shared";

function ThreadRow({ thread, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className={cn(
        "w-full border-b border-slate-100 px-4 py-3.5 text-left transition",
        active ? "bg-brand-50/70" : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{thread.subject}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {thread.requester} · {thread.channel}
          </span>
        </span>
        {thread.unread ? (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
            {thread.unread}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Badge tone={toneFor(thread.status)}>{thread.status}</Badge>
        <span className="flex items-center gap-1 text-[11px] text-ink-soft">
          <Clock className="h-3 w-3" />
          {fromNow(thread.updatedAt)}
        </span>
      </div>
    </button>
  );
}

export default function SupportPage() {
  const { role } = useAuth();
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState("");
  const toast = useToast();

  const { data: threads = [] } = useAsync(() => clinicService.getSupportThreads(), [], []);
  const { data: articles = [] } = useAsync(
    () => clinicService.getHelpArticles({ role }),
    [role],
    []
  );

  useEffect(() => {
    if (!active && threads.length) setActive(threads[0]);
  }, [threads, active]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Customer support"
        description="Conversations with the Odenta team, and the guides your role asks for most."
        actions={<Button leftIcon={<MessageSquarePlus className="h-4 w-4" />}>New request</Button>}
      />

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 overflow-hidden lg:col-span-4">
          <CardHeader title="Requests" subtitle={`${threads.length} conversations`} />
          <div className="mt-3 border-t border-slate-100">
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                active={active?.id === thread.id}
                onSelect={setActive}
              />
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          {active ? (
            <>
              <CardHeader
                title={active.subject}
                subtitle={`${active.requester} · ${active.channel} · priority ${active.priority}`}
                action={<Badge tone={toneFor(active.status)}>{active.status}</Badge>}
              />
              <CardBody className="flex min-h-[340px] flex-col gap-4 pt-4">
                {active.messages.map((message) => (
                  <div key={message.id} className={cn("flex gap-3", message.me && "flex-row-reverse")}>
                    <Avatar name={message.from} size="sm" />
                    <div className={cn("max-w-[76%]", message.me && "text-right")}>
                      <div className="text-[12px] text-ink-soft">
                        {message.from} · {formatDate(message.at, "dd MMM · HH:mm")}
                      </div>
                      <div
                        className={cn(
                          "mt-1 rounded-2xl px-4 py-3 text-[13.5px]",
                          message.me ? "bg-brand-600 text-white" : "bg-slate-100 text-ink"
                        )}
                      >
                        {message.body}
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
              <div className="flex items-end gap-3 border-t border-slate-100 px-5 py-4">
                <Textarea
                  rows={2}
                  placeholder="Write a reply…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button
                  disabled={!draft.trim()}
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={() => {
                    toast.success("Reply sent");
                    setDraft("");
                  }}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <EmptyState title="Select a conversation" description="Pick a request on the left." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Help articles"
          subtitle="Short guides relevant to your role"
        />
        <CardBody className="grid gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {articles.length === 0 ? (
            <EmptyState title="No articles yet" className="col-span-full py-8" />
          ) : (
            articles.map((article) => (
              <a
                key={article.id}
                href="#help"
                className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3.5 transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink">{article.title}</span>
                  <span className="block text-[12px] text-ink-soft">
                    {article.category} · {article.minutes} min read
                  </span>
                </span>
              </a>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
