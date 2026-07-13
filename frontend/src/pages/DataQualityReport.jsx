import { useEffect, useState } from "react";
import {
  getQualityLevelLabel,
  qualityCopy,
  translateQualityText,
} from "../i18n";
import {
  analyzeDataset,
  downloadDataQualityIssues,
  getLatestDataQualityReport,
} from "../services/dataQualityService";
import ScoreProgress from "../components/common/ScoreProgress";
import StatusBadge from "../components/common/StatusBadge";
import "./DataQualityReport.css";
import { useAuth } from "../authContext";

function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

function DataQualityReport({ language }) {
  const text = qualityCopy[language] || qualityCopy.en;
  const isArabic = language === "ar";
  const { user } = useAuth();
  const canAnalyze = ["admin", "analyst"].includes(user?.role);
  const [report, setReport] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [activeIssueFilter, setActiveIssueFilter] = useState(0);
  const [requiredColumns, setRequiredColumns] = useState("");
  const [uniqueColumns, setUniqueColumns] = useState("");
  const [dateColumns, setDateColumns] = useState("");

  const handlePrint = () => {
    window.print();
  }; 
  useEffect(() => {
    const fetchLatestReport = () => {
      getLatestDataQualityReport()
        .then((data) => {
          setReport(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchLatestReport();
  }, [text.errors.fetchReport]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(text.errors.chooseFile);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const splitColumns = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
      const data = await analyzeDataset(selectedFile, {
        required_columns: splitColumns(requiredColumns),
        unique_columns: splitColumns(uniqueColumns),
        date_columns: splitColumns(dateColumns),
      });
      setReport(data);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="status-page">{text.loading}</div>;
  }

  if (!report) {
    return <div className="status-page">{error || (isArabic ? "لا يوجد تقرير جودة بيانات." : "No data quality report is available.")}</div>;
  }

  const qualityLevel = getQualityLevelLabel(report.quality_level, language);
  const issueFilters = isArabic ? ["الكل", "حرج", "عال", "متوسط", "منخفض"] : ["All", "Critical", "High", "Medium", "Low"];
  const generatedByLocalAi = isArabic ? "نتيجة فحص آلي محلي" : "Local automated check";
  const dimensionCards = [
    { label: isArabic ? "الاكتمال" : "Completeness", score: Number(report.completeness_score ?? Math.max(0, 100 - Number(report.missing_values || 0) * 4)), status: qualityLevel },
    { label: isArabic ? "التفرد" : "Uniqueness", score: Number(report.uniqueness_score ?? (report.duplicate_rows > 0 ? 0 : 100)), status: qualityLevel },
    { label: isArabic ? "الصلاحية" : "Validity", score: Number(report.validity_score ?? 100), status: qualityLevel },
  ];
  const issueRows = report.recommendations.map((item, index) => ({
    issue: translateQualityText(item.issue, language),
    dimension: index === 0 ? (isArabic ? "الاكتمال" : "Completeness") : (isArabic ? "التفرد" : "Uniqueness"),
    records: index === 0 ? report.missing_values : report.duplicate_rows,
    severity: index === 0 && report.missing_values > 0 ? "High" : "Medium",
    recommendation: translateQualityText(item.recommendation, language),
  }));
  const filterPriorities = [null, "Critical", "High", "Medium", "Low"];
  const filteredIssueRows = activeIssueFilter === 0 ? issueRows : issueRows.filter((issue) => issue.severity === filterPriorities[activeIssueFilter]);

  return (
    <div className="report-page">
      <div className="report-header no-print">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>

        <button onClick={handlePrint}>{text.print}</button>
      </div>

      <div className="upload-box no-print">
        <div>
          <h3>{text.uploadTitle}</h3>
          <p>{text.uploadHelp}</p>
        </div>

        <div className="upload-actions">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            disabled={!canAnalyze}
          />

          <button onClick={handleUpload} disabled={uploading || !canAnalyze}>
            {!canAnalyze ? (isArabic ? "عرض فقط" : "Read only") : uploading ? text.analyzing : text.analyzeDataset}
          </button>
        </div>

        <div className="quality-rules-grid">
          <label><span>{isArabic ? "الأعمدة المطلوبة" : "Required columns"}</span><input disabled={!canAnalyze} onChange={(event) => setRequiredColumns(event.target.value)} placeholder={isArabic ? "مثال: رقم العميل، الاسم" : "Example: customer_id, name"} value={requiredColumns} /><small>{isArabic ? "الفصل بين الأسماء بفاصلة" : "Separate names with commas"}</small></label>
          <label><span>{isArabic ? "الأعمدة الفريدة" : "Unique columns"}</span><input disabled={!canAnalyze} onChange={(event) => setUniqueColumns(event.target.value)} placeholder={isArabic ? "مثال: رقم العميل" : "Example: customer_id"} value={uniqueColumns} /></label>
          <label><span>{isArabic ? "أعمدة التاريخ" : "Date columns"}</span><input disabled={!canAnalyze} onChange={(event) => setDateColumns(event.target.value)} placeholder={isArabic ? "مثال: تاريخ الإنشاء" : "Example: created_at"} value={dateColumns} /></label>
        </div>

        {selectedFile && (
          <p className="selected-file">{text.selectedFile}: {selectedFile.name}</p>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="report-container">
        <section className="report-title">
          <div>
            <span>{text.dataset}</span>
            <h2>{report.file_name}</h2>
            <p>{report.asset_name}</p>
          </div>

          <div className={`score-badge ${report.quality_level.toLowerCase().replace(" ", "-")}`}>
            <strong>{report.quality_score}%</strong>
            <span>{qualityLevel}</span>
          </div>
        </section>

        <section className="metrics-grid">
          <MetricCard title={text.totalRows} value={report.total_rows} />
          <MetricCard title={text.totalColumns} value={report.total_columns} />
          <MetricCard title={text.missingValues} value={report.missing_values} />
          <MetricCard title={text.duplicateRows} value={report.duplicate_rows} />
        </section>

        <section className="quality-dimension-grid">
          {dimensionCards.map((dimension) => (
            <article className="quality-dimension-card" key={dimension.label}>
              <div>
                <h3>{dimension.label}</h3>
                <StatusBadge status={dimension.status} />
              </div>
              <ScoreProgress score={dimension.score} />
            </article>
          ))}
        </section>

        <section className="summary-box">
          <h3>{text.summaryTitle}</h3>
          <p>{text.summary(report.quality_score, qualityLevel)}</p>
        </section>

        <section className="quality-issues-section">
          <div className="quality-section-title">
            <h3>{isArabic ? "مشاكل جودة البيانات" : "Data Quality Issues"}</h3>
            <div className="filter-pills">
              {issueFilters.map((filter, index) => (
                <button className={index === activeIssueFilter ? "active" : ""} onClick={() => setActiveIssueFilter(index)} type="button" key={filter}>{filter}</button>
              ))}
            </div>
          </div>
          <div className="table-shell">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>{isArabic ? "المشكلة" : "Issue"}</th>
                  <th>{isArabic ? "البعد" : "Dimension"}</th>
                  <th>{isArabic ? "السجلات المتأثرة" : "Affected Records"}</th>
                  <th>{isArabic ? "الأولوية" : "Severity"}</th>
                  <th>{isArabic ? "التوصية" : "Recommendation"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssueRows.map((issue) => (
                  <tr key={`${issue.issue}-${issue.dimension}`}>
                    <td><strong>{issue.issue}</strong></td>
                    <td>{issue.dimension}</td>
                    <td>{issue.records}</td>
                    <td><StatusBadge status={issue.severity} /></td>
                    <td>{issue.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="recommendations-section">
          <h3>{text.recommendationsTitle}</h3>

          {report.recommendations.length === 0 ? (
            <p className="empty-message">{text.emptyRecommendations}</p>
          ) : (
            report.recommendations.map((item, index) => (
              <div className="recommendation-card" key={index}>
                <div className="recommendation-number">{index + 1}</div>

                <div>
                  <h4>{translateQualityText(item.issue, language)}</h4>
                  <p className="details">{translateQualityText(item.details, language)}</p>
                  <p className="recommendation">
                    <strong>{text.recommendationLabel}</strong>{" "}
                    {translateQualityText(item.recommendation, language)}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="next-actions">
          <h3>{text.nextActions}</h3>
          <ul>
            {text.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        <section className="ai-quality-recommendations">
          <article>
            <span>{isArabic ? "أولوية عالية" : "High Priority"}</span>
            <h3>{isArabic ? "تحسين اكتمال البيانات" : "Improve Data Completeness"}</h3>
            <p>
              {isArabic
                ? `تم اكتشاف ${report.missing_values} قيمة ناقصة. يجب مراجعة الخلايا الفارغة وإكمال الحقول المطلوبة قبل استخدام البيانات.`
                : `${report.missing_values} records contain missing values that require review before operational use.`}
            </p>
            <strong>{generatedByLocalAi}</strong>
          </article>
          <article>
            <span>{isArabic ? "أولوية عالية" : "High Priority"}</span>
            <h3>{isArabic ? "معالجة السجلات المكررة" : "Resolve Duplicate Records"}</h3>
            <p>
              {isArabic
                ? `تم اكتشاف ${report.duplicate_rows} صف مكرر. طبّقي مفاتيح أعمال فريدة وادمجي السجلات.`
                : `${report.duplicate_rows} duplicate rows were identified. Apply unique business keys and merge records.`}
            </p>
            <strong>{generatedByLocalAi}</strong>
          </article>
        </section>

        {report.column_profiles?.length > 0 && <section className="column-profile-section">
          <div className="column-profile-heading"><div><h3>{isArabic ? "تحليل الأعمدة" : "Column profiling"}</h3><p>{isArabic ? "نتائج فعلية لكل عمود، بما فيها القيم الناقصة والصلاحية ومؤشرات البيانات الشخصية." : "Actual per-column completeness, validity, and potential personal-data indicators."}</p></div>{report.issue_count > 0 && <button onClick={() => downloadDataQualityIssues(report.report_id)} type="button">{isArabic ? `تنزيل الأخطاء (${report.issue_count})` : `Download issues (${report.issue_count})`}</button>}</div>
          <div className="table-shell"><table className="enterprise-table"><thead><tr>{(isArabic ? ["العمود", "النوع", "الناقص", "الفريد", "المكرر", "الصلاحية", "بيانات شخصية محتملة"] : ["Column", "Type", "Missing", "Unique", "Duplicates", "Validity", "Potential PII"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{report.column_profiles.map((profile) => <tr key={profile.column_name}><td><strong>{profile.column_name}</strong></td><td>{profile.data_type}</td><td>{profile.missing_values}</td><td>{profile.unique_values}</td><td>{profile.duplicate_values}</td><td>{profile.validity_score}%</td><td>{profile.pii_type || "—"}</td></tr>)}</tbody></table></div>
        </section>}
      </div>
    </div>
  );
}

export default DataQualityReport;
