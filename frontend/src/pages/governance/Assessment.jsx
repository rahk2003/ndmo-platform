import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import KpiCard from "../../components/common/KpiCard";
import ScoreProgress from "../../components/common/ScoreProgress";
import StatusBadge from "../../components/common/StatusBadge";
import { assessmentCopy } from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getAssessmentSummary } from "../../services/ndmoService";

const statusFor = (score) => score >= 85 ? "Compliant" : score < 60 ? "Non-Compliant" : "Partially Compliant";

function Assessment() {
  const { language, isArabic } = useLanguage();
  const text = assessmentCopy[language] || assessmentCopy.en;
  const [data, setData] = useState(null);

  useEffect(() => { getAssessmentSummary().then(setData).catch(() => setData(null)); }, []);

  const overall = data?.overall_summary;
  const domains = data?.domains_summary || [];
  const answered = Number(overall?.answered_questions || 0);
  const total = Number(overall?.total_questions || 0);
  const score = Number(overall?.overall_score || 0);

  return <div className="page-stack">
    <PageHeader eyebrow={text.eyebrow} title={text.title} subtitle={isArabic ? "النتائج أدناه من إجاباتك والأدلة التي رفعتها فقط؛ المتطلبات غير المجابة تُحتسب صفرًا." : "Results use only your answers and uploaded evidence; unanswered requirements count as zero."} />
    {!data ? <EmptyState icon={ClipboardCheck} title={isArabic ? "لا توجد بيانات تقييم" : "No assessment data"} description={isArabic ? "يجب تشغيل الباك إند ثم الإجابة عن متطلبات NDMO أو رفع الأدلة." : "Start the backend, answer NDMO requirements, or upload evidence."} /> : <>
      <section className="assessment-hero enterprise-card"><div><span>{text.overallScore}</span><strong>{score}%</strong><ScoreProgress score={score} /></div><div className="assessment-stats">
        <KpiCard icon={ClipboardCheck} label={text.requirements} value={total} tone="blue" />
        <KpiCard icon={ShieldCheck} label={isArabic ? "تمت الإجابة" : "Answered"} value={answered} tone="green" />
        <KpiCard icon={FileSearch} label={isArabic ? "غير مجاب" : "Unanswered"} value={Math.max(total - answered, 0)} tone="red" />
        <KpiCard icon={FileSearch} label={isArabic ? "الأدلة المرفوعة" : "Uploaded evidence"} value={Number(overall?.uploaded_evidence || 0)} tone="indigo" />
      </div></section>
      <section className="domain-grid">{domains.map((domain) => {
        const domainScore = Number(domain.domain_score || 0);
        return <Link className="domain-card" to={`/assessment/${domain.domain_id}`} key={domain.domain_id}>
          <div className="domain-card-icon"><ShieldCheck size={22} /></div><div><h2>{isArabic ? domain.domain_name_ar : domain.domain_name_en}</h2><p>{text.domainSummary(Number(domain.total_questions || 0), Number(domain.uploaded_evidence || 0))}</p></div><ScoreProgress score={domainScore} /><StatusBadge status={statusFor(domainScore)} />
        </Link>;
      })}</section>
    </>}
  </div>;
}

export default Assessment;
