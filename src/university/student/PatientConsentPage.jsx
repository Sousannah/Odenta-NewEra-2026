import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, FileSignature, Pen, Type, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";

/**
 * Treatment consent.
 *
 * Consent gates everything: no step on this case can be submitted for review
 * until it is signed, which is why the form is a tab of its own rather than a
 * checkbox on the sheet. Three signature methods because a teaching clinic
 * sees all three — a patient who will type their name, one who wants the pen,
 * and one who brings a signed page from home.
 */

const METHODS = [
  { value: "text", label: "Text signature", icon: Type },
  { value: "draw", label: "Draw signature", icon: Pen },
  { value: "upload", label: "Upload signature", icon: Upload },
];

const CONSENT_BODY = [
  "I understand that there are risks associated with dental treatment including but not limited to sensitivity or pain in treated or adjacent teeth; infection requiring additional treatment; fracture of teeth or restorations; swelling, bleeding or discomfort following procedures; reactions to medications, anaesthetics or materials used; and changes in occlusion requiring adjustment.",
  "I understand that during treatment, unforeseen conditions may arise which may necessitate procedures different from those planned. I consent to those additional procedures that are necessary in the professional judgement of my treating clinician.",
  "I understand that I may ask questions about the planned procedures and that I have the right to be informed of alternative treatments. I have disclosed my complete medical history, including medications and allergies.",
  "I consent to the administration of local anaesthesia, antibiotics, analgesics or any other medication necessary for dental treatment, and I understand the risks involved.",
  "I consent to the making of photographs, video recordings and radiographs before, during and after treatment, and to their use for scientific, educational or research purposes.",
];

export default function PatientConsentPage() {
  const { record, setRecord } = useOutletContext();
  const toast = useToast();

  const signed = Boolean(record.consent?.isSigned ?? record.consentSigned);

  const [method, setMethod] = useState("text");
  const [text, setText] = useState(record.consent?.signatureText ?? "");
  const [drawn, setDrawn] = useState("");
  const [uploaded, setUploaded] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const drawing = useRef(false);

  /* The canvas needs a white ground, not transparency: the PNG that comes off
     it is stored as-is and rendered on white in the signed panel. */
  useEffect(() => {
    if (method !== "draw" || signed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0F2E3D";
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [method, signed]);

  const pointAt = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startStroke = (event) => {
    if (signed) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = pointAt(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawing.current = true;
  };

  const stroke = (event) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = pointAt(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endStroke = () => {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.getContext("2d")?.closePath();
    setDrawn(canvasRef.current.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#0F2E3D";
    setDrawn("");
  };

  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Select a valid image file.");
    if (file.size > 5 * 1024 * 1024) return setError("File size must be less than 5MB.");
    const reader = new FileReader();
    reader.onload = (loaded) => {
      setUploaded(loaded.target.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const sign = async () => {
    if (method === "text" && !text.trim()) return setError("Type the patient's full name.");
    if (method === "draw" && !drawn) return setError("Draw the signature on the pad.");
    if (method === "upload" && !uploaded) return setError("Upload a signature image.");

    setSubmitting(true);
    setError("");
    try {
      const updated = await universityService.signConsent(record.id, {
        method,
        signatureText: method === "text" ? text : "",
        signatureImage: method === "draw" ? drawn : method === "upload" ? uploaded : "",
      });
      setRecord(updated);
      toast.success("Consent signed", "Steps on this case can now be submitted for review.");
    } catch (cause) {
      setError(cause?.message ?? "Could not sign the consent form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Dental treatment consent"
        description={
          signed
            ? "This consent form has been signed and can no longer be modified."
            : "Read the form with the patient, then capture their signature."
        }
        actions={
          signed ? (
            <Badge tone="success">
              <Check className="h-3 w-3" />
              Signed {formatDate(record.consent?.signedAt ?? record.consentSignedAt, "d MMM yyyy")}
            </Badge>
          ) : (
            <Badge tone="warning">
              <FileSignature className="h-3 w-3" />
              Not signed
            </Badge>
          )
        }
      />

      {!signed ? (
        <InfoBanner tone="warning">
          Nothing on this case can be submitted for staff review until consent is captured.
        </InfoBanner>
      ) : null}

      <Card>
        <CardHeader title="General dental treatment consent" />
        <CardBody className="flex flex-col gap-4 pt-2 text-[13.5px] leading-relaxed text-ink-muted">
          <p>
            I, <span className="font-bold text-ink">{record.patientName}</span>, hereby authorise the
            dental team to perform the following dental treatment or oral surgery procedure(s):
            examination, radiographs, prophylaxis, fluoride treatment, restorations, crowns, bridges,
            extractions, root canal therapy, periodontal therapy, and other procedures deemed
            necessary.
          </p>
          {CONSENT_BODY.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
          <p className="font-semibold text-ink">
            By signing below, I acknowledge that I have read and understand this consent form, had the
            opportunity to ask questions, and give my consent for dental treatment.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Patient signature"
          subtitle={signed ? "Captured and locked" : "Choose how the patient will sign"}
        />
        <CardBody className="flex flex-col gap-4 pt-2">
          {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

          {signed ? (
            <div className="rounded-2xl border border-success/25 bg-success-soft/60 p-5">
              <span className="od-label">Signed signature</span>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                {record.consent?.signatureText ? (
                  <p className="text-[22px] font-semibold italic text-ink">
                    {record.consent.signatureText}
                  </p>
                ) : record.consent?.signatureImage ? (
                  <img
                    src={record.consent.signatureImage}
                    alt="Patient signature"
                    className="max-h-24"
                  />
                ) : (
                  <p className="text-[13px] text-ink-soft">No signature image on file</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((entry) => {
                  const Icon = entry.icon;
                  const selected = method === entry.value;
                  return (
                    <button
                      key={entry.value}
                      type="button"
                      onClick={() => {
                        setMethod(entry.value);
                        setError("");
                      }}
                      aria-pressed={selected}
                      className={cn(
                        "od-focus inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition",
                        selected
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-slate-200 bg-white text-ink-muted hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {entry.label}
                    </button>
                  );
                })}
              </div>

              {method === "text" ? (
                <Field label="Type the patient's full name as their signature">
                  <Input
                    value={text}
                    placeholder="Type the full name here"
                    onChange={(event) => setText(event.target.value)}
                  />
                </Field>
              ) : null}

              {method === "draw" ? (
                <div>
                  <span className="mb-2 block text-[13px] font-semibold text-ink">
                    Draw the signature below
                  </span>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={180}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={startStroke}
                      onMouseMove={stroke}
                      onMouseUp={endStroke}
                      onMouseLeave={endStroke}
                      onTouchStart={(event) => {
                        event.preventDefault();
                        const touch = event.touches[0];
                        startStroke({ clientX: touch.clientX, clientY: touch.clientY });
                      }}
                      onTouchMove={(event) => {
                        event.preventDefault();
                        const touch = event.touches[0];
                        stroke({ clientX: touch.clientX, clientY: touch.clientY });
                      }}
                      onTouchEnd={endStroke}
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={clearCanvas}>
                    Clear
                  </Button>
                </div>
              ) : null}

              {method === "upload" ? (
                <div>
                  <span className="mb-2 block text-[13px] font-semibold text-ink">
                    Upload a signature image
                  </span>
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                    {uploaded ? (
                      <img
                        src={uploaded}
                        alt="Uploaded signature"
                        className="max-h-32 rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-8 text-center">
                        <Upload className="h-6 w-6 text-ink-faint" />
                        <span className="text-[13px] text-ink-soft">No signature uploaded</span>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={readFile}
                    />
                    <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                      {uploaded ? "Change image" : "Select image"}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-faint">
                    Supported formats: JPG, PNG, GIF. Maximum file size: 5MB.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
            <div>
              <span className="od-label">Patient name</span>
              <p className="text-[15px] font-bold text-ink">{record.patientName}</p>
            </div>
            <div className="text-right">
              <span className="od-label">Date</span>
              <p className="text-[15px] font-bold text-ink">
                {formatDate(record.consent?.signedAt ?? new Date(), "d MMM yyyy")}
              </p>
            </div>
          </div>
        </CardBody>

        {!signed ? (
          <footer className="flex justify-end border-t border-slate-100 px-5 py-4">
            <Button
              loading={submitting}
              leftIcon={<FileSignature className="h-4 w-4" />}
              onClick={sign}
            >
              Sign consent form
            </Button>
          </footer>
        ) : null}
      </Card>
    </div>
  );
}
