import { Building2, MessageCircle } from "lucide-react";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useT } from "@/site/i18n/LanguageContext";
import { CTABand, PageHero, Section, SiteButton } from "@/site/components";
import {
  DirectoryCard,
  DirectoryEmpty,
  DirectorySkeleton,
  JoinCard,
  contactHref,
} from "@/site/components/Directory";

function ClinicCard({ clinic, delay }) {
  const t = useT();

  return (
    <DirectoryCard
      delay={delay}
      cover={clinic.image}
      name={clinic.name}
      place={clinic.city}
      summary={clinic.focus}
      facts={[
        clinic.since ? { label: { en: "On Odenta since", ar: "على أودنتا منذ" }, value: clinic.since } : null,
        clinic.chairs ? { label: { en: "Chairs", ar: "الكراسي" }, value: clinic.chairs } : null,
        clinic.dentists ? { label: { en: "Dentists", ar: "الأطباء" }, value: clinic.dentists } : null,
      ].filter(Boolean)}
      actions={
        <SiteButton
          size="sm"
          to={contactHref(site.contact, "clinic", clinic.name?.en)}
          leftIcon={<MessageCircle className="h-4 w-4" />}
        >
          {t({ en: "Contact us", ar: "تواصل معنا" })}
        </SiteButton>
      }
    />
  );
}

export default function ClinicsPage() {
  const { data: clinics, loading, error } = useAsync(() => siteService.getPartnerClinics(), [], []);
  const list = clinics ?? [];

  return (
    <>
      <PageHero
        eyebrow={{ en: "Clinics", ar: "العيادات" }}
        eyebrowIcon={<Building2 className="h-3.5 w-3.5" />}
        title={{ en: "Practices that run", ar: "عيادات تعمل" }}
        highlight={{ en: "beautifully.", ar: "بانسيابية." }}
        description={{
          en: "The clinics that have brought their whole day onto Odenta — appointments, records, billing and team, all in one calm place.",
          ar: "العيادات التي نقلت يومها بالكامل إلى أودنتا — المواعيد والسجلات والفواتير والفريق، في مكان واحد هادئ.",
        }}
      />

      <Section className="pt-4 lg:pt-6">
        {error ? (
          <DirectoryEmpty
            message={{
              en: "We couldn't load the clinics just now. Please try again in a moment.",
              ar: "تعذر تحميل العيادات الآن. يرجى المحاولة بعد قليل.",
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading && !list.length ? (
              <DirectorySkeleton />
            ) : (
              list.map((clinic, index) => <ClinicCard key={clinic.id} clinic={clinic} delay={index * 90} />)
            )}
            {!loading ? (
              <JoinCard
                delay={list.length * 90}
                title={{ en: "Your clinic, next.", ar: "عيادتك، التالية." }}
                description={{
                  en: "Move your practice onto Odenta. We bring your patients and history across with you.",
                  ar: "انقل عيادتك إلى أودنتا. ننقل معك مرضاك وتاريخهم بالكامل.",
                }}
                to={contactHref(site.contact, "clinic")}
                cta={{ en: "Contact us", ar: "تواصل معنا" }}
              />
            ) : null}
          </div>
        )}
      </Section>

      <CTABand
        title={{ en: "Less admin.", ar: "إدارة أقل." }}
        highlight={{ en: "More care.", ar: "رعاية أكثر." }}
        description={{
          en: "See how a day at your clinic looks on Odenta — from the first call to the final receipt.",
          ar: "شاهد كيف يبدو يوم في عيادتك على أودنتا — من أول مكالمة حتى آخر إيصال.",
        }}
      />
    </>
  );
}
