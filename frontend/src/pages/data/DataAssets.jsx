import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Database, FileSpreadsheet } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import KpiCard from "../../components/common/KpiCard";
import ScoreProgress from "../../components/common/ScoreProgress";
import { dataAssetsCopy } from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getDataQualityReports } from "../../services/dataQualityService";
import { formatGregorianDate } from "../../utils/dateFormat";

function DataAssets() {
  const { language, isArabic } = useLanguage();
  const text = dataAssetsCopy[language] || dataAssetsCopy.en;
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getDataQualityReports().then(setReports).catch(() => setReports([]));
  }, []);

  const filteredReports = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return reports;
    return reports.filter((item) => `${item.asset_name} ${item.file_name}`.toLowerCase().includes(value));
  }, [query, reports]);

  const totalRows = reports.reduce((total, item) => total + Number(item.total_rows || 0), 0);
  const averageQuality = reports.length
    ? Math.round(reports.reduce((total, item) => total + Number(item.quality_score || 0), 0) / reports.length)
    : 0;

  return (
    <div className="page-stack">
      <PageHeader eyebrow={text.eyebrow} title={text.title} subtitle={isArabic ? "تعرض هذه الصفحة فقط الملفات التي رفعتها لتحليل جودة البيانات." : "This page only shows files you uploaded for data quality analysis."} />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title={isArabic ? "لا توجد ملفات مرفوعة" : "No uploaded files"}
          description={isArabic ? "يمكن رفع ملف من صفحة جودة البيانات، وسيظهر هنا بعد اكتمال التحليل." : "Upload a file from Data Quality and it will appear here after analysis."}
          action={<Link className="primary-action" to="/data-quality">{isArabic ? "رفع ملف" : "Upload file"}</Link>}
        />
      ) : (
        <>
          <section className="kpi-grid">
            <KpiCard icon={Database} label={isArabic ? "الملفات المرفوعة" : "Uploaded files"} value={reports.length} tone="blue" />
            <KpiCard icon={Database} label={isArabic ? "إجمالي الصفوف" : "Total rows"} value={totalRows.toLocaleString()} tone="indigo" />
            <KpiCard icon={Database} label={isArabic ? "متوسط الجودة" : "Average quality"} value={`${averageQuality}%`} tone="green" />
            <KpiCard icon={Database} label={isArabic ? "ملفات تحتاج معالجة" : "Files needing remediation"} value={reports.filter((item) => Number(item.quality_score) < 80).length} tone="red" />
          </section>
          <section className="enterprise-card">
            <div className="filters-row">
              <input aria-label={text.search} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={text.search} value={query} />
            </div>
            <div className="table-shell">
              <table className="enterprise-table">
                <thead><tr>{(isArabic ? ["المعرف", "اسم الأصل", "اسم الملف", "الصفوف", "الأعمدة", "درجة الجودة", "تاريخ التحليل", "الإجراء"] : ["ID", "Asset", "File", "Rows", "Columns", "Quality", "Analyzed", "Action"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
                <tbody>{filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.id}</td><td><strong>{report.asset_name}</strong></td><td>{report.file_name}</td><td>{report.total_rows}</td><td>{report.total_columns}</td>
                    <td><ScoreProgress score={report.quality_score} /></td><td>{formatGregorianDate(report.created_at, language)}</td>
                    <td><Link className="text-button" to={`/data-assets/${report.id}`}>{text.open}</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default DataAssets;
