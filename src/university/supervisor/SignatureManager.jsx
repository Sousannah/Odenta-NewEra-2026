import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Save, Signature, Type } from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The mark a supervisor signs a step off with.
 *
 * Two ways to make one, because faculties disagree about which is a signature:
 * a typed name, rendered in a hand, or something actually drawn. Both end up
 * as one string on the server, so the decision endpoint never has to care.
 *
 * The signature is fetched and stored against the session, not passed in from
 * the screen that uses it — a signature the client can supply is a signature
 * anyone can forge.
 */

const CANVAS = { width: 600, height: 150 };

const isDrawn = (value) => typeof value === "string" && value.startsWith("data:image");

/** Renders whichever kind of signature this is, at whatever size is asked for. */
export function SignatureMark({ value, className, alt = "Signature" }) {
  if (!value) return <span className="text-[13px] text-ink-faint">No signature on file</span>;
  return isDrawn(value) ? (
    <img src={value} alt={alt} className={cn("max-h-full max-w-full object-contain", className)} />
  ) : (
    <span
      className={cn("text-[24px] leading-tight text-ink", className)}
      style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
    >
      {value}
    </span>
  );
}

export function SignatureManager({ onSaved, autoCloseDelay = 1200 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const [saved, setSaved] = useState(null);
  const [mode, setMode] = useState("text");
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    universityService
      .getSignature()
      .then((result) => {
        if (cancelled) return;
        const value = result?.signature ?? null;
        setSaved(value);
        setEditing(!value);
        if (value && !isDrawn(value)) {
          setMode("text");
          setTyped(value);
        } else if (value) {
          setMode("draw");
        }
      })
      .catch(() => {
        if (!cancelled) setEditing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* A fixed backing size keeps the stroke the same weight whatever the pane is
     scaled to, and the white fill is what makes the exported PNG printable. */
  const primeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    canvas.width = CANVAS.width;
    canvas.height = CANVAS.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0C2432";
    context.lineWidth = 2.4;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return context;
  }, []);

  useEffect(() => {
    if (mode !== "draw" || !editing) return;
    primeCanvas();
  }, [mode, editing, primeCanvas]);

  const pointAt = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] ?? event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = pointAt(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawing.current = true;
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = pointAt(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setDraft(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  const clear = () => {
    primeCanvas();
    setDraft(null);
  };

  const current = mode === "text" ? typed.trim() : draft;

  const save = async () => {
    if (!current) {
      setError(mode === "text" ? "Type your name first." : "Draw your signature first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await universityService.saveSignature(current);
      const value = result?.signature ?? current;
      setSaved(value);
      setDone(true);
      onSaved?.(value);
      window.setTimeout(() => {
        setDone(false);
        setEditing(false);
      }, autoCloseDelay);
    } catch (cause) {
      setError(cause?.message ?? "Could not save the signature.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  /* --------------------------------------------------------- saved state */
  if (!editing && saved) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Signature className="h-4 w-4 text-brand-600" />
              Your signature
            </span>
            <Button variant="secondary" size="xs" onClick={() => setEditing(true)}>
              Change
            </Button>
          </div>
          <div className="flex h-[132px] items-center justify-center px-4">
            <SignatureMark value={saved} />
          </div>
        </div>
        <p className="text-[12px] text-ink-soft">
          This mark is attached to every step you accept. It is held against your account, so it
          cannot be applied by anyone else.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------------- editing state */
  return (
    <div className="flex flex-col gap-4">
      {done ? <InfoBanner tone="success">Signature saved.</InfoBanner> : null}
      {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "text", label: "Type it", icon: Type },
          { key: "draw", label: "Draw it", icon: PenLine },
        ].map((option) => {
          const Icon = option.icon;
          const selected = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setMode(option.key);
                setError("");
              }}
              className={cn(
                "od-focus flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition",
                selected
                  ? "border-brand-600 bg-brand-50/70 text-brand-800"
                  : "border-slate-200 text-ink-muted hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      {mode === "text" ? (
        <Field label="Full name as you sign it">
          <Input
            value={typed}
            placeholder="Dr Hala Mansour"
            onChange={(event) => setTyped(event.target.value)}
          />
        </Field>
      ) : (
        <div>
          <span className="od-label">Sign in the box</span>
          <canvas
            ref={canvasRef}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
            className="mt-2 h-[150px] w-full cursor-crosshair touch-none rounded-xl border border-slate-300 bg-white"
          />
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            leftIcon={<Eraser className="h-4 w-4" />}
            onClick={clear}
          >
            Clear
          </Button>
        </div>
      )}

      {current ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <span className="od-label">Preview</span>
          <div className="mt-2 flex h-[72px] items-center justify-center rounded-xl bg-white">
            <SignatureMark value={current} alt="Signature preview" />
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {saved ? (
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        ) : null}
        <Button leftIcon={<Save className="h-4 w-4" />} loading={busy} onClick={save}>
          Save signature
        </Button>
      </div>
    </div>
  );
}
