import { FileText } from "lucide-react";
import { legalDocuments } from "@/site/content/legal";
import { useT } from "@/site/i18n/LanguageContext";
import { PageHero, Reveal, Section } from "@/site/components";

/** Renders either legal document — `<LegalPage document="privacy" />`. */
export default function LegalPage({ document = "privacy" }) {
  const t = useT();
  const doc = legalDocuments[document] ?? legalDocuments.privacy;

  return (
    <>
      <PageHero
        eyebrow={{ en: "Legal", ar: "قانوني" }}
        eyebrowIcon={<FileText className="h-3.5 w-3.5" />}
        title={doc.title}
        description={doc.intro}
      />

      <Section tone="plain" className="pt-0">
        <div className="mx-auto max-w-3xl">
          <p className="od-label">
            {t({ en: "Last updated", ar: "آخر تحديث" })}{" "}
            {new Date(doc.updated).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="mt-8 flex flex-col gap-8">
            {doc.sections.map((section, index) => (
              <Reveal
                key={index}
                delay={index * 60}
                className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card"
              >
                <h2 className="text-[20px] font-extrabold text-brand-700">{t(section.heading)}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-muted">{t(section.body)}</p>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border border-warning/30 bg-warning-soft px-5 py-4 text-[13.5px] leading-relaxed text-warning-ink">
            {t({
              en: "This is a working draft for the product team. Have counsel review it before it becomes the published policy.",
              ar: "هذه مسودة عمل لفريق المنتج. يجب مراجعتها قانونيًا قبل نشرها كسياسة معتمدة.",
            })}
          </p>
        </div>
      </Section>
    </>
  );
}
