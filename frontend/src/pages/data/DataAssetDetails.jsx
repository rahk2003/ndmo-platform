import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import ScoreProgress from "../../components/common/ScoreProgress";
import { useLanguage } from "../../language";
import { getDataQualityReportDetails } from "../../services/dataQualityService";
import { formatGregorianDateTime } from "../../utils/dateFormat";

function DataAssetDetails() {
  const { assetId } = useParams();
  const { language, isArabic } = useLanguage();
  const [report, setReport] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDataQualityReportDetails(assetId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoaded(true));
  }, [assetId]);

  if (!loaded) return null;
  if (!report) return (
    <EmptyState icon={FileSpreadsheet} title={isArabic ? "الملف غير موجود" : "File not found"} description={isArabic ? "لا توجد بيانات مرفوعة بهذا المعرف." : "No uploaded data exists with this ID."} action={<Link className="primary-action" to="/data-assets">{isArabic ? "العودة للملفات" : "Back to files"}</Link>} />
  );

  const fields = isArabic ? [
    ["اسم الملف", report.file_name], ["إجمالي الصفوف", report.total_rows], ["إجمالي الأعمدة", report.total_columns], ["القيم الناقصة", report.missing_values], ["الصفوف المكررة", report.duplicate_rows], ["درجة الاكتمال", `${report.completeness_score}%`], ["درجة التفرد", `${report.uniqueness_score}%`], ["درجة الصلاحية", `${report.validity_score}%`], ["تاريخ التحليل", formatGregorianDateTime(report.created_at, language)],
  ] : [
    ["File name", report.file_name], ["Total rows", report.total_rows], ["Total columns", report.total_columns], ["Missing values", report.missing_values], ["Duplicate rows", report.duplicate_rows], ["Completeness", `${report.completeness_score}%`], ["Uniqueness", `${report.uniqueness_score}%`], ["Validity", `${report.validity_score}%`], ["Analyzed", formatGregorianDateTime(report.created_at, language)],
  ];

  return <div className="page-stack">
    <PageHeader eyebrow={`#${report.id}`} title={report.asset_name} subtitle={isArabic ? "نتائج فعلية محسوبة من الملف الذي رفعته." : "Actual results calculated from your uploaded file."} />
    <section className="enterprise-card domain-detail-header"><div><span>{isArabic ? "درجة الجودة" : "Quality score"}</span><strong>{report.quality_score}%</strong></div><ScoreProgress score={report.quality_score} /></section>
    <section className="asset-detail-grid">{fields.map(([label, value]) => <article className="enterprise-card asset-info-card" key={label}><h2>{label}</h2><strong>{value}</strong></article>)}</section>
    {report.column_profiles?.length > 0 && <section className="enterprise-card"><h2>{isArabic ? "تحليل الأعمدة" : "Column profiling"}</h2><div className="table-shell"><table className="enterprise-table"><thead><tr>{(isArabic ? ["العمود", "النوع", "الناقص", "الفريد", "الصلاحية", "بيانات شخصية محتملة"] : ["Column", "Type", "Missing", "Unique", "Validity", "Potential PII"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{report.column_profiles.map((profile) => <tr key={profile.column_name}><td><strong>{profile.column_name}</strong></td><td>{profile.data_type}</td><td>{profile.missing_values}</td><td>{profile.unique_values}</td><td>{profile.validity_score}%</td><td>{profile.pii_type || "—"}</td></tr>)}</tbody></table></div></section>}
  </div>;
}

export default DataAssetDetails;
