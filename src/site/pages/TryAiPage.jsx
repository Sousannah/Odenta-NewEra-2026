import { useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  FileImage,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { siteService } from "@/services";
import { images } from "@/theme/assets";
import { useT } from "@/site/i18n/LanguageContext";
import { CTABand, PageHero, Reveal, Section, SectionHeading, SiteButton } from "@/site/components";
import { OdentaLoader, OdentaSpinner } from "@/components/ui/OdentaLoader";

const SAMPLES = [
  { key: "panoramic", label: { en: "Panoramic", ar: "بانورامية" }, image: images.xray },
  { key: "periapical", label: { en: "Periapical", ar: "ذروية" }, image: images.xrayDetail },
  { key: "bitewing", label: { en: "Bitewing", ar: "لدغية" }, image: images.aiDetail },
];

const SEVERITY_TONE = {
  high: "bg-danger-soft text-danger",
  moderate: "bg-warning-soft text-warning-ink",
  low: "bg-accent-50 text-accent-700",
};

/** The film with the model's bounding boxes drawn over it. */
function AnnotatedFilm({ image, findings, active, onHover }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink">
      <img src={image} alt="" aria-hidden="true" className="aspect-[16/10] w-full object-cover" />

      {findings.map((finding) => {
        const isActive = active === finding.id;
        return (
          <button
            key={finding.id}
            type="button"
            onMouseEnter={() => onHover(finding.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(finding.id)}
            onBlur={() => onHover(null)}
            aria-label={`${finding.tooth} — ${finding.condition.en}`}
            className={cn(
              "absolute rounded-lg border-2 transition-all duration-300",
              isActive
                ? "border-accent-300 bg-accent-500/25 shadow-accent"
                : "border-accent-400/80 bg-accent-500/10 hover:bg-accent-500/20"
            )}
            style={{
              left: `${finding.box.x * 100}%`,
              top: `${finding.box.y * 100}%`,
              width: `${finding.box.width * 100}%`,
              height: `${finding.box.height * 100}%`,
            }}
          >
            <span className="absolute -top-6 start-0 whitespace-nowrap rounded-md bg-accent-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              {finding.tooth}
            </span>
          </button>
        );
      })}

      <span className="absolute bottom-3 end-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
        {findings.length} findings
      </span>
    </div>
  );
}

function FindingRow({ finding, active, onHover }) {
  const t = useT();

  return (
    <li
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-4 transition",
        active ? "border-accent-300 bg-accent-50/60" : "border-slate-200/80 bg-white"
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[13px] font-extrabold text-brand-700">
        {finding.tooth}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-extrabold text-ink">{t(finding.condition)}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide",
              SEVERITY_TONE[finding.severity]
            )}
          >
            {finding.severity}
          </span>
        </div>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{t(finding.note)}</p>
        <p className="mt-1 text-[12px] font-semibold text-ink-soft">{t(finding.surface)}</p>
      </div>

      <div className="w-16 shrink-0 text-end">
        <span className="block text-[16px] font-extrabold od-gradient-text">
          {Math.round(finding.confidence * 100)}%
        </span>
        <span className="block text-[10.5px] font-bold uppercase tracking-wide text-ink-soft">
          conf.
        </span>
      </div>
    </li>
  );
}

export default function TryAiPage() {
  const t = useT();
  const fileInput = useRef(null);
  const [sample, setSample] = useState(SAMPLES[0]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [state, setState] = useState("idle"); // idle | analysing | done | error
  const [active, setActive] = useState(null);
  const [error, setError] = useState(null);

  const image = preview?.url ?? sample.image;

  const pickFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), name: file.name });
    setResult(null);
    setState("idle");
  };

  const analyse = async () => {
    setState("analysing");
    setError(null);
    try {
      /* Against the live API this becomes a multipart upload; the response
         shape — and therefore everything below — does not change. */
      const analysis = await siteService.analyseRadiograph({
        fileName: preview?.name ?? `${sample.key}-sample.jpg`,
        imageType: sample.key,
      });
      setResult(analysis);
      setState("done");
    } catch (cause) {
      setError(cause?.message ?? "Analysis failed. Please try again.");
      setState("error");
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setState("idle");
    setActive(null);
  };

  return (
    <>
      <PageHero
        eyebrow={{ en: "Live demo", ar: "عرض مباشر" }}
        eyebrowIcon={<Sparkles className="h-3.5 w-3.5" />}
        title={{ en: "See the model", ar: "شاهد النموذج" }}
        highlight={{ en: "read a radiograph", ar: "يقرأ الأشعة" }}
        description={{
          en: "Pick a sample film or upload your own. Odenta Vision returns boxed findings with a confidence score on each — the same output the clinical portal writes onto the chart.",
          ar: "اختر صورة نموذجية أو ارفع صورتك. يعيد Odenta Vision نتائج محددة بدرجة ثقة لكل منها — نفس المخرجات التي تُكتب على المخطط في البوابة السريرية.",
        }}
      />

      <Section tone="canvas" className="pt-0">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* ------------------------------------------------------ control */}
          <Reveal className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card">
              <h2 className="text-[19px] font-extrabold text-brand-700">
                {t({ en: "1 · Choose an image", ar: "١ · اختر صورة" })}
              </h2>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {SAMPLES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSample(item);
                      setPreview(null);
                      setResult(null);
                      setState("idle");
                    }}
                    className={cn(
                      "od-focus overflow-hidden rounded-2xl border-2 transition",
                      !preview && sample.key === item.key
                        ? "border-accent-500 shadow-accent"
                        : "border-transparent hover:border-accent-200"
                    )}
                  >
                    <img src={item.image} alt="" aria-hidden="true" className="h-16 w-full object-cover" />
                    <span className="block bg-white py-1.5 text-[11.5px] font-bold text-ink-muted">
                      {t(item.label)}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="od-focus mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-canvas px-6 py-8 text-center transition hover:border-accent-400 hover:bg-accent-50/40"
              >
                <Upload className="h-6 w-6 text-accent-600" />
                <span className="text-[14px] font-bold text-ink">
                  {preview?.name ?? t({ en: "Upload your own X-ray", ar: "ارفع صورتك الشعاعية" })}
                </span>
                <span className="text-[12.5px] text-ink-soft">
                  {t({ en: "JPG or PNG · stays in your browser", ar: "JPG أو PNG · تبقى في متصفحك" })}
                </span>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={pickFile}
              />

              <h2 className="mt-8 text-[19px] font-extrabold text-brand-700">
                {t({ en: "2 · Run the analysis", ar: "٢ · شغّل التحليل" })}
              </h2>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <SiteButton
                  onClick={analyse}
                  disabled={state === "analysing"}
                  className="flex-1"
                  leftIcon={
                    state === "analysing" ? (
                      <OdentaSpinner size={16} tone="current" />
                    ) : (
                      <ScanLine className="h-4 w-4" />
                    )
                  }
                >
                  {state === "analysing"
                    ? t({ en: "Analysing…", ar: "جارٍ التحليل…" })
                    : t({ en: "Analyse", ar: "حلّل" })}
                </SiteButton>

                {result ? (
                  <SiteButton variant="ghost" onClick={reset}>
                    {t({ en: "Reset", ar: "إعادة" })}
                  </SiteButton>
                ) : null}
              </div>

              {error ? (
                <p className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-[13.5px] font-semibold text-danger">
                  {error}
                </p>
              ) : null}

              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4">
                <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning-ink" />
                <p className="text-[12.5px] leading-relaxed text-warning-ink">
                  {t({
                    en: "This public demo is for illustration only. It is not a medical device and must not be used to diagnose or treat a patient.",
                    ar: "هذا العرض العام للتوضيح فقط. ليس جهازًا طبيًا ولا يجوز استخدامه لتشخيص أو علاج مريض.",
                  })}
                </p>
              </div>
            </div>
          </Reveal>

          {/* ------------------------------------------------------ results */}
          <Reveal delay={120} className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[19px] font-extrabold text-brand-700">
                  {t({ en: "Analysis result", ar: "نتيجة التحليل" })}
                </h2>
                {result ? (
                  <span className="flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-[12px] font-bold text-brand-700">
                    <Brain className="h-3.5 w-3.5" />
                    {result.model} · {(result.processingMs / 1000).toFixed(1)}s
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                {result ? (
                  <AnnotatedFilm
                    image={image}
                    findings={result.findings}
                    active={active}
                    onHover={setActive}
                  />
                ) : (
                  <div className="relative overflow-hidden rounded-3xl bg-ink">
                    <img
                      src={image}
                      alt=""
                      aria-hidden="true"
                      className={cn(
                        "aspect-[16/10] w-full object-cover transition",
                        state === "analysing" ? "opacity-60" : "opacity-90"
                      )}
                    />
                    {state === "analysing" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/35 backdrop-blur-[2px]">
                        <OdentaLoader
                          size="sm"
                          tone="light"
                          label={t({ en: "Reading the film…", ar: "قراءة الصورة…" })}
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {result ? (
                <ul className="mt-6 flex flex-col gap-3">
                  {result.findings.map((finding) => (
                    <FindingRow
                      key={finding.id}
                      finding={finding}
                      active={active === finding.id}
                      onHover={setActive}
                    />
                  ))}
                </ul>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
                  <FileImage className="h-7 w-7 text-ink-faint" />
                  <p className="text-[14px] font-semibold text-ink-muted">
                    {t({
                      en: "Findings appear here once the analysis runs.",
                      ar: "تظهر النتائج هنا بعد تشغيل التحليل.",
                    })}
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="plain">
        <SectionHeading
          eyebrow={{ en: "In the portal", ar: "داخل البوابة" }}
          title={{ en: "The same finding,", ar: "نفس النتيجة،" }}
          highlight={{ en: "on the chart", ar: "على المخطط" }}
          description={{
            en: "Inside Odenta, a confirmed finding writes straight onto the odontogram against its FDI tooth number — with the clinician's decision, not the model's, as the record.",
            ar: "داخل أودنتا، تُكتب النتيجة المؤكدة مباشرة على مخطط الأسنان مقابل رقم السن — وقرار الطبيب هو السجل، لا قرار النموذج.",
          }}
        >
          <SiteButton to={site.services} variant="ghost" className="mt-4">
            {t({ en: "How the platform works", ar: "كيف تعمل المنصة" })}
          </SiteButton>
        </SectionHeading>
      </Section>

      <CTABand />
    </>
  );
}
