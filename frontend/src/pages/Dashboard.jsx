import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, FileSearch, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import KpiCard from "../components/common/KpiCard";
import { dashboardCopy } from "../enterpriseI18n";
import { useLanguage } from "../language";
import { getDataQualityReports } from "../services/dataQualityService";
import { getAssessmentSummary, getAutoRecommendations } from "../services/ndmoService";

function Dashboard() {
  const { language, isArabic } = useLanguage();
  const text = dashboardCopy[language] || dashboardCopy.en;
  const [assessment, setAssessment] = useState(null);
  const [qualityReports, setQualityReports] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    getAssessmentSummary().then(setAssessment).catch(() => setAssessment(null));
    getDataQualityReports().then(setQualityReports).catch(() => setQualityReports([]));
    getAutoRecommendations().then((data) => setRecommendations(data.recommendations || [])).catch(() => setRecommendations([]));
  }, []);

  const domainChart = useMemo(() => (assessment?.domains_summary || []).map((domain) => ({ name: isArabic ? domain.domain_name_ar : domain.domain_name_en, score: Number(domain.domain_score || 0) })), [assessment, isArabic]);
  const overall = assessment?.overall_summary;
  const latestQuality = qualityReports[0];
  const hasData = Boolean(assessment || qualityReports.length);

  return <div className="page-stack">
    <PageHeader eyebrow={text.eyebrow} title={text.title} subtitle={isArabic ? "تعرض اللوحة النتائج الفعلية فقط من ملفاتك وإجابات التقييم." : "The dashboard only shows actual results from your files and assessment answers."} />
    {!hasData ? <EmptyState icon={Activity} title={isArabic ? "لا توجد بيانات بعد" : "No data yet"} description={isArabic ? "يمكن رفع ملف أو بدء تقييم NDMO لعرض المؤشرات." : "Upload a file or start the NDMO assessment to see metrics."} /> : <>
      <section className="kpi-grid">
        <KpiCard icon={ShieldCheck} label={text.compliance} value={`${Number(overall?.overall_score || 0)}%`} detail={isArabic ? `${Number(overall?.answered_questions || 0)} من ${Number(overall?.total_questions || 0)} مجاب` : `${Number(overall?.answered_questions || 0)} of ${Number(overall?.total_questions || 0)} answered`} tone="green" />
        <KpiCard icon={Activity} label={text.dataQuality} value={latestQuality ? `${latestQuality.quality_score}%` : "—"} detail={latestQuality?.file_name || (isArabic ? "لا يوجد ملف" : "No file")} tone="blue" />
        <KpiCard icon={FileSearch} label={text.evidenceCoverage} value={Number(overall?.uploaded_evidence || 0)} detail={isArabic ? "ملف دليل مرفوع" : "uploaded evidence files"} tone="indigo" />
        <KpiCard icon={AlertTriangle} label={text.criticalIssues} value={recommendations.filter((item) => item.priority === "Critical" && item.status !== "Resolved").length} detail={isArabic ? "فجوات حرجة مفتوحة فعليًا" : "actual open critical gaps"} tone="red" />
      </section>
      {domainChart.length > 0 && <article className="enterprise-card chart-card"><div className="card-header"><div><h2>{text.chartTitle}</h2><p>{text.chartSubtitle}</p></div><Link className="text-button" to="/assessment">{text.viewAssessment}</Link></div><div className="domain-chart"><ResponsiveContainer width="100%" height={430}><BarChart data={domainChart} layout="vertical" margin={isArabic ? { left: 24, right: 20 } : { left: 20, right: 24 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="name" width={isArabic ? 205 : 185} /><Tooltip /><Bar dataKey="score" radius={[0, 6, 6, 0]} fill="#1677FF" barSize={18} /></BarChart></ResponsiveContainer></div></article>}
    </>}
  </div>;
}
export default Dashboard;
