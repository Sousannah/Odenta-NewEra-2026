/**
 * Privacy and terms.
 *
 * Plain content objects so the same page component renders either document —
 * and so a legal team can hand back replacement text without touching JSX.
 * Review with counsel before launch; this is a working draft, not legal advice.
 */

export const legalDocuments = {
  privacy: {
    key: "privacy",
    title: { en: "Privacy policy", ar: "سياسة الخصوصية" },
    updated: "2026-09-01",
    intro: {
      en: "Odenta processes clinical data on behalf of the universities and clinics that use it. This policy explains what we hold, why, and what you can ask us to do with it.",
      ar: "تعالج أودنتا البيانات السريرية نيابة عن الجامعات والعيادات التي تستخدمها. توضح هذه السياسة ما نحتفظ به ولماذا وما يمكنك طلبه بشأنه.",
    },
    sections: [
      {
        heading: { en: "Who controls the data", ar: "من يتحكم في البيانات" },
        body: {
          en: "The clinic or university is the data controller for its patient records. Odenta is the processor: we hold and process that data under their instructions and do not use it for any other purpose.",
          ar: "العيادة أو الجامعة هي المتحكم في سجلات مرضاها. أودنتا هي المعالج: نحتفظ بالبيانات ونعالجها وفق تعليماتهم ولا نستخدمها لأي غرض آخر.",
        },
      },
      {
        heading: { en: "What we hold", ar: "ما نحتفظ به" },
        body: {
          en: "Patient demographics, clinical records, radiographs, treatment plans, appointments and financial transactions entered by your staff. For staff accounts we hold name, work email, role and sign-in activity.",
          ar: "بيانات المرضى والسجلات السريرية والأشعة وخطط العلاج والمواعيد والمعاملات المالية التي يدخلها فريقك. ولحسابات الموظفين نحتفظ بالاسم والبريد والدور ونشاط الدخول.",
        },
      },
      {
        heading: { en: "AI processing", ar: "معالجة الذكاء الاصطناعي" },
        body: {
          en: "Radiographs submitted for analysis are processed to return findings and are not used to train models unless your organisation opts in under a separate written agreement.",
          ar: "تُعالج الأشعة المرسلة للتحليل لإرجاع النتائج فقط، ولا تُستخدم لتدريب النماذج إلا بموافقة مؤسستك عبر اتفاق مكتوب منفصل.",
        },
      },
      {
        heading: { en: "Access and logging", ar: "الوصول والتسجيل" },
        body: {
          en: "Every read of a clinical record is logged with the acting user, the record and the time. Administrators can review that log at any point, and it is exportable for an audit.",
          ar: "يُسجَّل كل اطلاع على سجل سريري بالمستخدم والسجل والوقت. يمكن للمسؤولين مراجعة السجل في أي وقت وتصديره للمراجعة.",
        },
      },
      {
        heading: { en: "Retention and deletion", ar: "الاحتفاظ والحذف" },
        body: {
          en: "We keep data for as long as your organisation's contract runs, plus the clinical retention period your regulator requires. On termination we export your full record set and delete our copies within ninety days.",
          ar: "نحتفظ بالبيانات طوال مدة التعاقد إضافة إلى مدة الاحتفاظ السريري التي تفرضها الجهة المنظمة. عند الإنهاء نصدّر سجلاتك كاملة ونحذف نسخنا خلال تسعين يومًا.",
        },
      },
      {
        heading: { en: "Your rights", ar: "حقوقك" },
        body: {
          en: "Patients should direct access, correction and erasure requests to their clinic, which can action them inside Odenta. If you contact us directly we will pass the request to the controller.",
          ar: "على المرضى توجيه طلبات الوصول والتصحيح والحذف إلى عيادتهم، التي يمكنها تنفيذها داخل أودنتا. وإذا تواصلت معنا مباشرة سنحيل الطلب إلى المتحكم.",
        },
      },
      {
        heading: { en: "Contact", ar: "التواصل" },
        body: {
          en: "Data protection questions go to privacy@odenta.ai and are answered within five working days.",
          ar: "أسئلة حماية البيانات تُرسل إلى privacy@odenta.ai ويُرد عليها خلال خمسة أيام عمل.",
        },
      },
    ],
  },

  terms: {
    key: "terms",
    title: { en: "Terms of service", ar: "شروط الخدمة" },
    updated: "2026-09-01",
    intro: {
      en: "These terms govern use of the Odenta platform. A signed order form between your organisation and Odenta takes precedence where the two differ.",
      ar: "تحكم هذه الشروط استخدام منصة أودنتا. ويسود نموذج الطلب الموقّع بين مؤسستك وأودنتا عند الاختلاف.",
    },
    sections: [
      {
        heading: { en: "Clinical responsibility", ar: "المسؤولية السريرية" },
        body: {
          en: "Odenta is clinical software, not a clinician. Diagnosis, treatment planning and every clinical decision remain the responsibility of the registered practitioner. AI findings are decision support and must be confirmed by a clinician before they are acted on.",
          ar: "أودنتا برنامج سريري لا طبيب. يبقى التشخيص والتخطيط العلاجي وكل قرار سريري مسؤولية الممارس المسجل. ونتائج الذكاء الاصطناعي دعم للقرار ويجب تأكيدها من طبيب قبل التصرف بناءً عليها.",
        },
      },
      {
        heading: { en: "Accounts and access", ar: "الحسابات والوصول" },
        body: {
          en: "Accounts are personal and must not be shared. Your administrators are responsible for granting the least access each role needs and for removing accounts when staff leave.",
          ar: "الحسابات شخصية ولا يجوز مشاركتها. ومسؤولوك مسؤولون عن منح أقل صلاحية يحتاجها كل دور وإزالة الحسابات عند مغادرة الموظفين.",
        },
      },
      {
        heading: { en: "Acceptable use", ar: "الاستخدام المقبول" },
        body: {
          en: "Do not upload data you have no lawful basis to process, attempt to identify patients outside your care, or use the platform to build a competing model.",
          ar: "لا ترفع بيانات ليس لديك أساس قانوني لمعالجتها، ولا تحاول تحديد هوية مرضى خارج رعايتك، ولا تستخدم المنصة لبناء نموذج منافس.",
        },
      },
      {
        heading: { en: "Availability", ar: "الإتاحة" },
        body: {
          en: "We target 99.5% monthly availability, excluding scheduled maintenance announced at least five days ahead. Service credits are set out in your order form.",
          ar: "نستهدف إتاحة شهرية ٩٩٫٥٪ باستثناء الصيانة المجدولة المعلنة قبل خمسة أيام على الأقل. وتُحدد التعويضات في نموذج الطلب.",
        },
      },
      {
        heading: { en: "Fees", ar: "الرسوم" },
        body: {
          en: "Chair-based fees are billed monthly in arrears against chairs that saw at least one appointment. Price changes are given ninety days' notice and never apply mid-term.",
          ar: "تُحتسب الرسوم شهريًا بأثر رجعي على الكراسي التي استقبلت موعدًا واحدًا على الأقل. وتُبلَّغ تغييرات الأسعار قبل تسعين يومًا ولا تسري أثناء المدة.",
        },
      },
      {
        heading: { en: "Termination", ar: "الإنهاء" },
        body: {
          en: "Either party may terminate at the end of a term with thirty days' notice. On termination we provide a full structured export of your data before deletion.",
          ar: "يجوز لأي طرف الإنهاء عند نهاية المدة بإشعار ثلاثين يومًا. وعند الإنهاء نوفر تصديرًا كاملًا ومهيكلًا لبياناتك قبل الحذف.",
        },
      },
    ],
  },
};
