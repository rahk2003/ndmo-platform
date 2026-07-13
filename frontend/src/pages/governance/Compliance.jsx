import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Database,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import KpiCard from "../../components/common/KpiCard";
import PageHeader from "../../components/common/PageHeader";
import ScoreProgress from "../../components/common/ScoreProgress";
import StatusBadge from "../../components/common/StatusBadge";
import {
  complianceCopy,
  trDomain,
  trRecommendation,
} from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getAssessmentSummary, getAutoRecommendations } from "../../services/ndmoService";

const getStatusGroup = (status) => {
  if (status === "Compliant") return "compliant";
  if (status === "Non-Compliant") return "nonCompliant";
  return "partial";
};

function Compliance() {
  const { language, isArabic } = useLanguage();
  const text = complianceCopy[language] || complianceCopy.en;
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState([]);
  const [priorityItems, setPriorityItems] = useState([]);
  const [liveOverallScore, setLiveOverallScore] = useState(null);
  const [liveOverallEvidence, setLiveOverallEvidence] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    getAssessmentSummary()
      .then((data) => {
        if (!Array.isArray(data?.domains_summary)) return;
        const liveDomains = data.domains_summary.map((domain, index) => {
          const score = Number(domain.domain_score || 0);
          const name = domain.domain_name_en || `NDMO Domain ${index + 1}`;
          return {
            id: domain.domain_id || index + 1,
            name,
            nameAr: domain.domain_name_ar || name,
            score,
            requirements: Number(domain.total_questions || 0),
            evidence: Number(domain.uploaded_evidence || 0),
            status: score >= 85 ? "Compliant" : score < 60 ? "Non-Compliant" : "Partially Compliant",
          };
        });
        setDomains(liveDomains);
        setLiveOverallScore(Number(data.overall_summary?.overall_score || 0));
        setLiveOverallEvidence(Number(data.overall_summary?.uploaded_evidence || 0));
        setIsLive(true);
      })
      .catch(() => {
        setDomains([]);
        setLiveOverallScore(null);
        setIsLive(false);
      });
    getAutoRecommendations()
      .then((data) => setPriorityItems(Array.isArray(data?.recommendations) ? data.recommendations.slice(0, 3) : []))
      .catch(() => setPriorityItems([]));
  }, []);

  const summary = useMemo(() => {
    const totalRequirements = domains.reduce((total, domain) => total + domain.requirements, 0);
    const totalEvidence = liveOverallEvidence;
    const averageScore = liveOverallScore ?? Math.round(
      domains.reduce((total, domain) => total + domain.score, 0) / Math.max(domains.length, 1)
    );

    return {
      totalRequirements,
      totalEvidence,
      averageScore,
      compliant: domains.filter((domain) => getStatusGroup(domain.status) === "compliant").length,
      gaps: domains.filter((domain) => getStatusGroup(domain.status) === "nonCompliant").length,
    };
  }, [domains, liveOverallEvidence, liveOverallScore]);

  const filteredDomains = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return domains.filter((domain) => {
      const matchesFilter = activeFilter === "all" || getStatusGroup(domain.status) === activeFilter;
      const domainName = trDomain(domain, language).toLocaleLowerCase();
      return matchesFilter && (!normalizedQuery || domainName.includes(normalizedQuery));
    });
  }, [activeFilter, domains, language, query]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        actions={
          <Link className="primary-action compliance-header-action" to="/assessment">
            <ClipboardList size={17} />
            {text.openAssessment}
          </Link>
        }
      />

      <div className={`data-source-banner ${isLive ? "live" : "demo"}`}>
        <Database size={18} />
        <strong>{text.dataSource}:</strong>
        <span>{isLive ? text.liveDataSource : text.demoDataSource}</span>
      </div>

      <section className="kpi-grid five">
        <KpiCard
          icon={ShieldCheck}
          label={text.overallCompliance}
          value={`${summary.averageScore}%`}
          detail={summary.averageScore >= 85 ? text.compliant : summary.averageScore < 60 ? text.nonCompliant : text.partiallyCompliant}
          tone="green"
        />
        <KpiCard
          icon={ClipboardList}
          label={text.requirements}
          value={summary.totalRequirements}
          detail={text.requirementsDetail}
          tone="blue"
        />
        <KpiCard
          icon={CheckCircle2}
          label={text.compliantDomains}
          value={summary.compliant}
          detail={text.ofDomains(domains.length)}
          tone="green"
        />
        <KpiCard
          icon={AlertTriangle}
          label={text.highRiskDomains}
          value={summary.gaps}
          detail={text.needsAction}
          tone="red"
        />
        <KpiCard
          icon={CircleDot}
          label={text.evidenceFiles}
          value={summary.totalEvidence}
          detail={text.mappedEvidence}
          tone="indigo"
        />
      </section>

      <section className="compliance-overview-grid">
        <article className="enterprise-card compliance-posture-card">
          <div className="card-header">
            <div>
              <h2>{text.postureTitle}</h2>
              <p>{text.postureSubtitle}</p>
            </div>
            <StatusBadge status={summary.averageScore >= 85 ? "Compliant" : summary.averageScore < 60 ? "Non-Compliant" : "Partially Compliant"} />
          </div>

          <div className="compliance-score-row">
            <div className="compliance-score-ring" style={{ "--score": `${summary.averageScore * 3.6}deg` }}>
              <span>{summary.averageScore}%</span>
              <small>{text.score}</small>
            </div>
            <div className="compliance-breakdown">
              {[
                [text.compliant, summary.compliant, "success"],
                [text.partial, domains.length - summary.compliant - summary.gaps, "warning"],
                [text.nonCompliant, summary.gaps, "danger"],
              ].map(([label, value, tone]) => (
                <div key={label}>
                  <span className={`compliance-dot ${tone}`} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="enterprise-card compliance-actions-card">
          <div className="card-header">
            <div>
              <h2>{text.priorityTitle}</h2>
              <p>{text.prioritySubtitle}</p>
            </div>
            <Link className="text-button" to="/recommendations">{text.viewAll}</Link>
          </div>
          <div className="priority-action-list">
            {priorityItems.map((item, index) => {
              const recommendation = trRecommendation({
                title: item.issue,
                titleAr: item.issue_ar,
                domain: item.category,
                domainAr: item.category_ar,
                priority: "High",
              }, language);
              return (
                <div className="priority-action-row" key={`${item.category}-${index}`}>
                  <span className="priority-action-icon"><AlertTriangle size={18} /></span>
                  <div>
                    <strong>{recommendation.title}</strong>
                    <span>{recommendation.domain}</span>
                  </div>
                  <StatusBadge status={recommendation.priority} />
                </div>
              );
            })}
            {priorityItems.length === 0 && <div className="compliance-no-results">{text.noLiveFindings}</div>}
          </div>
        </article>
      </section>

      <article className="enterprise-card">
        <div className="card-header compliance-table-header">
          <div>
            <h2>{text.domainsTitle}</h2>
            <p>{text.domainsSubtitle}</p>
          </div>
          <div className="compliance-search">
            <Search size={17} />
            <input
              aria-label={text.search}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.search}
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className="filter-pills" aria-label={text.filterAria}>
          {text.filters.map((filter) => (
            <button
              className={activeFilter === filter.value ? "active" : ""}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="table-shell compliance-table-shell">
          <table className="enterprise-table compliance-table">
            <thead>
              <tr>
                {text.table.map((heading) => <th key={heading}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((domain) => (
                <tr key={domain.id}>
                  <td>
                    <Link className="compliance-domain-link" to={`/assessment/${domain.id}`}>
                      <span><ShieldCheck size={17} /></span>
                      <strong>{trDomain(domain, language)}</strong>
                    </Link>
                  </td>
                  <td><ScoreProgress score={domain.score} /></td>
                  <td>{domain.requirements}</td>
                  <td>{domain.evidence}</td>
                  <td><StatusBadge status={domain.status} /></td>
                  <td>
                    <Link className="table-button" to={`/assessment/${domain.id}`}>
                      {text.review}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDomains.length === 0 && (
            <div className="compliance-no-results">{text.noResults}</div>
          )}
        </div>
      </article>

      <section className="executive-strip">
        <UserRoundCheck size={20} />
        <strong>{text.ownershipTitle}</strong>
        <span>{text.ownershipText}</span>
        <Link className="text-button" to="/recommendations">
          {isArabic ? "عرض خطة المعالجة" : "View remediation plan"}
        </Link>
      </section>
    </div>
  );
}

export default Compliance;
