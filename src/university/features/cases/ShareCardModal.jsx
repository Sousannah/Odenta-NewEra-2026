import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Mail,
  MessageCircle,
  MessageSquare,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { departmentMeta } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InfoBanner } from "@/components/ui/Misc";
import { QrCode, qrSvgDocument } from "@/components/ui/QrCode";

/**
 * Hand a patient card to somebody.
 *
 * The QR is the primary control, not a decoration: the common case is a
 * patient holding out their phone at the desk, and pointing a camera at a
 * screen is faster than spelling an address. Everything under it is the same
 * link by another route, for the cases where the person is not in the room.
 *
 * The channels are plain links — `mailto:`, `sms:`, `https://wa.me/` and the
 * platform share sheet — rather than integrations. That is the point: no
 * account, no API key, no message leaving through Odenta's own servers, and
 * the desk keeps whatever audit trail their mail client already has. The
 * native sheet is offered first where the browser has one, because on a phone
 * it reaches every app the patient actually uses.
 */

/** The link's own copy, written once so every channel says the same thing. */
const messageFor = (item, url) =>
  [
    `${item?.patientName ?? "Patient"} — dental clinic card`,
    item?.cardNumber ? `Card ${item.cardNumber}` : null,
    `Open it here: ${url}`,
  ]
    .filter(Boolean)
    .join("\n");

export function ShareCardModal({ item, campus, open, onClose }) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(null);

  const url = useMemo(() => {
    if (!item?.shareToken) return null;
    const path = site.card(item.shareToken);
    return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  }, [item?.shareToken]);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setShareError(null);
  }, [open, item?.id]);

  if (!item) return null;

  const subject = `Dental clinic card — ${item.patientName}`;
  const body = url ? messageFor(item, url) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Could not reach the clipboard. Select the link and copy it by hand.");
    }
  };

  /* The platform sheet, where there is one — on a phone it reaches every
     messaging app installed, which no fixed list of channels can. */
  const nativeShare = async () => {
    try {
      await navigator.share({ title: subject, text: body, url });
    } catch (error) {
      /* A cancelled sheet is not a failure. */
      if (error?.name !== "AbortError") {
        setShareError("This browser would not open its share sheet.");
      }
    }
  };

  const downloadQr = () => {
    const blob = new Blob([qrSvgDocument(url)], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `card-${item.cardNumber ?? item.nationalId}.svg`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const channels = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      tone: "bg-success-soft text-success-strong",
      href: `https://wa.me/?text=${encodeURIComponent(body)}`,
      external: true,
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      tone: "bg-brand-100 text-brand-700",
      href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
    {
      key: "sms",
      label: "SMS",
      icon: MessageSquare,
      tone: "bg-info-soft text-info-ink",
      /* `?&body=` is the form that works on both iOS and Android. */
      href: `sms:?&body=${encodeURIComponent(body)}`,
    },
  ];

  const canShareNatively = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share this card"
      description={`${item.patientName} · ${departmentMeta(item.department).label}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={downloadQr}>
            Download the QR
          </Button>
        </>
      }
    >
      {!url ? (
        <InfoBanner tone="warning">
          This record has no card token yet. Issue the card at the desk and the QR appears here.
        </InfoBanner>
      ) : (
        <div className="flex flex-col gap-5">
          {shareError ? <InfoBanner tone="warning">{shareError}</InfoBanner> : null}

          {/* ------------------------------------------------------- the QR */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
            <QrCode
              value={url}
              size={168}
              title={`Patient card for ${item.patientName}`}
              className="shrink-0 shadow-card"
            />
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-[14px] font-extrabold text-ink">
                {campus?.shortName ?? "AIU"} Dental Clinic
                {item.cardNumber ? ` · ${item.cardNumber}` : ""}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                Point a camera at this to open the card — the patient's identity, who is
                treating them and when they are next expected.
              </p>
              <p className="mt-3 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11.5px] font-medium text-ink-soft">
                {url}
              </p>
            </div>
          </div>

          {/* -------------------------------------------------- the channels */}
          <div>
            <span className="od-label">Send it</span>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {canShareNatively ? (
                <ChannelButton
                  icon={Share2}
                  label="Share sheet"
                  tone="bg-brand-600 text-white"
                  onClick={nativeShare}
                />
              ) : null}

              {channels.map((channel) => (
                <ChannelButton
                  key={channel.key}
                  as="a"
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                  icon={channel.icon}
                  label={channel.label}
                  tone={channel.tone}
                />
              ))}

              <ChannelButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied" : "Copy link"}
                tone={copied ? "bg-success-soft text-success-strong" : "bg-slate-100 text-ink-muted"}
                onClick={copy}
              />
            </div>
          </div>

          <InfoBanner tone="neutral">
            Anybody holding this link can open the card, so treat it like the card itself. It
            shows identity, the allocated student and upcoming visits — never the chart, the
            history or anything clinical.
          </InfoBanner>
        </div>
      )}
    </Modal>
  );
}

function ChannelButton({ as: Tag = "button", icon: Icon, label, tone, className, ...rest }) {
  return (
    <Tag
      {...(Tag === "button" ? { type: "button" } : null)}
      className={cn(
        "od-focus flex flex-col items-center gap-2 rounded-xl border border-slate-200 px-3 py-3.5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card",
        className
      )}
      {...rest}
    >
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tone)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[12px] font-bold text-ink">{label}</span>
    </Tag>
  );
}
