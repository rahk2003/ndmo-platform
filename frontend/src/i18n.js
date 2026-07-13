export const appCopy = {
  en: {
    brand: "NDMO Platform",
    subtitle: "Assessment Workspace",
    aiTab: "AI Evidence Analyzer",
    qualityTab: "Data Quality Report",
    languageToggle: "العربية",
    languageLabel: "Switch to Arabic",
  },
  ar: {
    brand: "منصة NDMO",
    subtitle: "مساحة تقييم الامتثال",
    aiTab: "محلل الأدلة الذكي",
    qualityTab: "تقرير جودة البيانات",
    languageToggle: "English",
    languageLabel: "التبديل إلى الإنجليزية",
  },
};

export const aiCopy = {
  en: {
    eyebrow: "Local Evidence Analysis",
    title: "Automated Evidence Analysis",
    model: "Analyzer",
    scope: "Scope",
    scopeAria: "Analysis scope",
    domain: "Domain",
    domainScope: "Domain",
    allScope: "All NDMO",
    evidenceFile: "Evidence File",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    cancel: "Cancel",
    readOnly: "Read only",
    analysisLimitNotice: (analyzed, total) =>
      `Analyzed ${analyzed} of ${total} questions in this processing batch.`,
    selectedFile: "Selected file",
    ndiScore: "NDI Score",
    questions: "Questions",
    yes: "Yes",
    partial: "Partial",
    no: "No",
    assessmentResults: "Assessment Results",
    evidenceFileFallback: "Evidence file",
    questionCount: (count) => `${count} questions`,
    tableQuestion: "Question",
    tableAnswer: "Analysis Decision",
    tableConfidence: "Confidence",
    tableReason: "Reason",
    tableEvidence: "Evidence",
    tableCorrection: "Correction",
    predicted: "Predicted",
    corrected: "Corrected",
    created: "Created",
    noMatchingText: "No matching text",
    saved: "Saved",
    trainingDataset: "Saved Review Corrections",
    trainingCount: (count) => `${count} reviewer corrections saved.`,
    refresh: "Refresh",
    refreshing: "Refreshing...",
    targetModel: "Target Analyzer",
    baseModel: "Base Analyzer",
    labels: "Labels",
    questionTextUnavailable: "Question text not available",
    noEvidenceText: "No evidence text",
    emptyTraining: "Review assessment answers to build a traceable correction history.",
    errors: {
      chooseFile: "Please choose an evidence file.",
      chooseDomain: "Please choose a domain.",
      loadDomains: "Could not load NDMO domains.",
      loadTraining: "Could not load training dataset.",
      analysisFailed: "Evidence analysis failed.",
      networkError: "The local analyzer connection was interrupted. Please retry; large Excel files are processed in bounded batches.",
      fileTooLarge: (limit) => `The file exceeds the ${limit} MB evidence limit.`,
      analysisCancelled: "Analysis was cancelled.",
      analysisTimeout: "Analysis took too long and was stopped. Try a smaller file or one domain at a time.",
      missingEvidenceId: "Missing evidence id for feedback.",
      feedbackFailed: "Could not save feedback.",
    },
  },
  ar: {
    eyebrow: "تحليل الأدلة المحلي",
    title: "تحليل الأدلة آليًا",
    model: "المحلل",
    scope: "نطاق التحليل",
    scopeAria: "نطاق التحليل",
    domain: "المجال",
    domainScope: "مجال واحد",
    allScope: "كل NDMO",
    evidenceFile: "ملف الدليل",
    analyze: "تحليل",
    analyzing: "جار التحليل...",
    cancel: "إلغاء",
    readOnly: "عرض فقط",
    analysisLimitNotice: (analyzed, total) =>
      `تم تحليل ${analyzed} من أصل ${total} سؤال في دفعة المعالجة الحالية.`,
    selectedFile: "الملف المختار",
    ndiScore: "درجة NDI",
    questions: "الأسئلة",
    yes: "نعم",
    partial: "جزئي",
    no: "لا",
    assessmentResults: "نتائج التقييم",
    evidenceFileFallback: "ملف الدليل",
    questionCount: (count) => `${count} سؤال`,
    tableQuestion: "السؤال",
    tableAnswer: "قرار التحليل",
    tableConfidence: "الثقة",
    tableReason: "سبب القرار",
    tableEvidence: "الدليل",
    tableCorrection: "التصحيح",
    predicted: "قرار التحليل",
    corrected: "التصحيح",
    created: "تاريخ الحفظ",
    noMatchingText: "لا يوجد نص مطابق",
    saved: "تم الحفظ",
    trainingDataset: "تصحيحات المراجعة المحفوظة",
    trainingCount: (count) => `تم حفظ ${count} تصحيح من المراجعة.`,
    refresh: "تحديث",
    refreshing: "جار التحديث...",
    targetModel: "المحلل المستهدف",
    baseModel: "المحلل الأساسي",
    labels: "التصنيفات",
    questionTextUnavailable: "نص السؤال غير متوفر",
    noEvidenceText: "لا يوجد نص دليل",
    emptyTraining: "يُبنى سجل تصحيحات قابل للتتبع بعد مراجعة إجابات التحليل.",
    errors: {
      chooseFile: "يجب اختيار ملف دليل أولًا.",
      chooseDomain: "يجب اختيار المجال أولًا.",
      loadDomains: "تعذر تحميل مجالات NDMO.",
      loadTraining: "تعذر تحميل بيانات التدريب.",
      analysisFailed: "فشل تحليل الدليل.",
      networkError: "انقطع الاتصال بالمحلل المحلي. أعيدي المحاولة؛ تتم معالجة ملفات Excel الكبيرة الآن ضمن حدود آمنة.",
      fileTooLarge: (limit) => `يتجاوز الملف حد الأدلة البالغ ${limit} ميجابايت.`,
      analysisCancelled: "تم إلغاء التحليل.",
      analysisTimeout: "استغرق التحليل وقتًا طويلًا وتم إيقافه. جربي ملفًا أصغر أو مجالًا واحدًا.",
      missingEvidenceId: "رقم الدليل غير موجود لحفظ التصحيح.",
      feedbackFailed: "تعذر حفظ التصحيح.",
    },
  },
};

export const qualityCopy = {
  en: {
    loading: "Loading report...",
    title: "Data Quality Report",
    subtitle: "Dataset quality report based on automated checks and analysis.",
    print: "Download / Print PDF",
    uploadTitle: "Upload Dataset",
    uploadHelp: "Upload an Excel or CSV file to analyze data quality automatically.",
    analyzeDataset: "Analyze Dataset",
    analyzing: "Analyzing...",
    selectedFile: "Selected file",
    dataset: "Dataset",
    totalRows: "Total Rows",
    totalColumns: "Total Columns",
    missingValues: "Missing Values",
    duplicateRows: "Duplicate Rows",
    summaryTitle: "Quality Summary",
    summary: (score, level) =>
      `The uploaded dataset has a quality score of ${score}%, which is classified as ${level}. The main detected issues are shown in the recommendations section below.`,
    recommendationsTitle: "Data Quality Recommendations",
    emptyRecommendations: "No recommendations available yet.",
    recommendationLabel: "Recommendation:",
    nextActions: "Next Actions",
    actions: [
      "Complete missing required fields.",
      "Remove duplicate records.",
      "Define unique identifiers for important records.",
      "Improve data collection rules and validation.",
    ],
    errors: {
      chooseFile: "Please select a CSV or Excel file first.",
      fetchReport: "Failed to fetch report.",
      analyzeDataset: "Failed to analyze dataset.",
    },
  },
  ar: {
    loading: "جار تحميل التقرير...",
    title: "تقرير جودة البيانات",
    subtitle: "تقرير يوضح جودة البيانات بناءً على الفحص والتحليل الآلي.",
    print: "تحميل / طباعة PDF",
    uploadTitle: "رفع مجموعة بيانات",
    uploadHelp: "يمكن رفع ملف Excel أو CSV لتحليل جودة البيانات تلقائيًا.",
    analyzeDataset: "تحليل البيانات",
    analyzing: "جار التحليل...",
    selectedFile: "الملف المختار",
    dataset: "مجموعة البيانات",
    totalRows: "عدد الصفوف",
    totalColumns: "عدد الأعمدة",
    missingValues: "القيم الناقصة",
    duplicateRows: "الصفوف المكررة",
    summaryTitle: "ملخص الجودة",
    summary: (score, level) =>
      `حصلت مجموعة البيانات المرفوعة على درجة جودة ${score}%، وتصنيفها الحالي هو ${level}. تظهر أهم الملاحظات في قسم التوصيات أدناه.`,
    recommendationsTitle: "توصيات جودة البيانات",
    emptyRecommendations: "لا توجد توصيات حالياً.",
    recommendationLabel: "التوصية:",
    nextActions: "الخطوات التالية",
    actions: [
      "يجب إكمال الحقول المطلوبة الناقصة.",
      "أزيلي السجلات المكررة.",
      "حددي معرفات فريدة للسجلات المهمة.",
      "حسّني قواعد جمع البيانات والتحقق منها.",
    ],
    errors: {
      chooseFile: "يجب اختيار ملف CSV أو Excel أولًا.",
      fetchReport: "تعذر تحميل التقرير.",
      analyzeDataset: "تعذر تحليل مجموعة البيانات.",
    },
  },
};

const answerLabels = {
  en: {
    yes: "Yes",
    partial: "Partial",
    no: "No",
  },
  ar: {
    yes: "نعم",
    partial: "جزئي",
    no: "لا",
  },
};

const qualityLevels = {
  en: {
    High: "High",
    Medium: "Medium",
    Low: "Low",
    "Very Low": "Very Low",
    "Not Available": "Not Available",
  },
  ar: {
    High: "مرتفع",
    Medium: "متوسط",
    Low: "منخفض",
    "Very Low": "منخفض جدًا",
    "Not Available": "غير متوفر",
  },
};

const qualityText = {
  "Missing values detected": "تم اكتشاف قيم ناقصة",
  "Duplicate rows detected": "تم اكتشاف صفوف مكررة",
  "Low completeness score": "درجة الاكتمال منخفضة",
  "Low uniqueness score": "درجة التفرد منخفضة",
  "Good data quality": "جودة البيانات جيدة",
  "Review empty cells and complete missing required fields before using the dataset.":
    "يجب مراجعة الخلايا الفارغة وإكمال الحقول المطلوبة قبل استخدام البيانات.",
  "Remove duplicate records to improve data uniqueness and reliability.":
    "أزيلي السجلات المكررة لتحسين تفرد البيانات وموثوقيتها.",
  "Improve data collection process and make important fields mandatory.":
    "حسني عملية جمع البيانات واجعلي الحقول المهمة إلزامية.",
  "Apply duplicate detection rules and define unique identifiers for records.":
    "طبقي قواعد لاكتشاف التكرار وحددي معرفات فريدة للسجلات.",
  "Continue monitoring data quality regularly.":
    "استمري في مراقبة جودة البيانات بشكل دوري.",
  "No major data quality issues were detected.":
    "لم يتم اكتشاف مشاكل جوهرية في جودة البيانات.",
};

export function getAnswerLabel(answer, language) {
  const normalized = answer || "no";
  return answerLabels[language]?.[normalized] || answerLabels.en[normalized] || answerLabels.en.no;
}

export function getQualityLevelLabel(level, language) {
  return qualityLevels[language]?.[level] || level;
}

export function translateQualityText(text, language) {
  if (language !== "ar" || !text) {
    return text;
  }

  if (qualityText[text]) {
    return qualityText[text];
  }

  const missingMatch = text.match(/^The dataset contains (.+) missing values\.$/);
  if (missingMatch) {
    return `تحتوي مجموعة البيانات على ${missingMatch[1]} قيمة ناقصة.`;
  }

  const duplicateMatch = text.match(/^The dataset contains (.+) duplicate rows\.$/);
  if (duplicateMatch) {
    return `تحتوي مجموعة البيانات على ${duplicateMatch[1]} صف مكرر.`;
  }

  const completenessMatch = text.match(/^Completeness score is (.+)%\.$/);
  if (completenessMatch) {
    return `درجة اكتمال البيانات هي ${completenessMatch[1]}%.`;
  }

  const uniquenessMatch = text.match(/^Uniqueness score is (.+)%\.$/);
  if (uniquenessMatch) {
    return `درجة تفرد البيانات هي ${uniquenessMatch[1]}%.`;
  }

  return text;
}
