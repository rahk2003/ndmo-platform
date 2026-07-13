import { useEffect, useMemo, useState } from "react";
import { Database, FileSearch, Lightbulb, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { recommendationsCopy, trRecommendation } from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getAutoRecommendations, saveRemediation } from "../../services/ndmoService";
import { formatGregorianDate } from "../../utils/dateFormat";
import { useAuth } from "../../authContext";


const domainFor = (category = "") => ({
  Metadata: "Data Catalog and Metadata",
  Classification: "Data Classification",
  Governance: "Data Governance",
  Quality: "Data Quality",
  Sharing: "Data Sharing",
}[category] || category || "Data Governance");


const mapLiveRecommendations = (items = []) => items.map((item) => ({
  id: item.id,
  resultId: item.result_id,
  questionId: item.question_id,
  domainId: item.domain_id,
  priority: item.priority || "Medium",
  domain: domainFor(item.category),
  domainAr: item.category_ar,
  title: item.issue,
  titleAr: item.issue_ar,
  description: item.question_text_en || item.issue,
  descriptionAr: item.question_text_ar || item.issue_ar,
  analysis: item.analysis,
  analysisAr: item.analysis_ar || item.analysis,
  action: item.recommendation,
  actionAr: item.recommendation_ar,
  reference: item.question_code,
  status: item.status || "Open",
  owner: item.owner_name || "",
  dueDate: item.due_date || "",
  notes: item.notes || "",
  evidenceFile: item.evidence_file,
  evidenceLocation: item.evidence_location,
  confidence: item.confidence,
  source: item.source || "Uploaded evidence assessment result",
  sourceAr: "نتيجة تقييم مرتبطة بملف الدليل المرفوع",
}));


function Recommendations() {
  const { language, isArabic } = useLanguage();
  const { user } = useAuth();
  const canEdit = ["admin", "analyst", "reviewer"].includes(user?.role);
  const text = recommendationsCopy[language] || recommendationsCopy.en;
  const [items, setItems] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAutoRecommendations()
      .then((data) => {
        if (!active) return;
        setItems(mapLiveRecommendations(data.recommendations || []));
        setIsLive(true);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setItems([]);
        setIsLive(false);
        setError(requestError?.response?.data?.detail || requestError.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 0) return items;
    const priorities = ["Critical", "High", "Medium", "Low"];
    return items.filter((item) => item.priority === priorities[activeFilter - 1]);
  }, [activeFilter, items]);

  const persistChanges = async (item, changes) => {
    setSaving(true);
    setError("");
    try {
      const next = { ...item, ...changes };
      await saveRemediation(item.id, {
        result_id: item.resultId,
        question_id: item.questionId,
        domain_id: item.domainId,
        owner_name: next.owner || null,
        due_date: next.dueDate || null,
        status: next.status,
        notes: next.notes || null,
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? next : entry));
      return true;
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDialog = async (event) => {
    event.preventDefault();
    const actionValue = new FormData(event.currentTarget).get("actionValue")?.toString().trim() || "";
    if (!actionValue) return;
    const changes = dialog.type === "plan"
      ? { status: "In Progress", dueDate: actionValue }
      : { owner: actionValue };
    const saved = await persistChanges(dialog.item, changes);
    if (!saved) return;
    setToast(dialog.type === "plan" ? text.planSaved : text.ownerSaved);
    setDialog(null);
  };

  const resolveItem = async (item) => {
    if (await persistChanges(item, { status: "Resolved" })) setToast(text.resolvedSaved);
  };

  const openDialog = (type, item) => {
    setDialog({ type, item });
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow={text.eyebrow} title={text.title} subtitle={isArabic ? "كل توصية مرتبطة بمتطلب وملف دليل، وتُحفظ خطة معالجتها في قاعدة البيانات." : "Every recommendation is linked to a requirement and evidence file, with remediation saved in the database."} />
      {error && <div className="page-error-banner">{error}</div>}
      <div className={`data-source-banner ${isLive ? "live" : "demo"}`}><Database size={18} /><strong>{text.source}:</strong><span>{isLive ? text.liveSource : text.demoSource}</span></div>
      <div className="filter-pills" aria-label={text.filterAria}>{text.filters.map((filter, index) => <button className={activeFilter === index ? "active" : ""} onClick={() => setActiveFilter(index)} type="button" key={filter}>{filter}</button>)}</div>
      <section className="recommendation-grid">
        {filteredItems.map((item) => {
          const recommendation = trRecommendation(item, language);
          return <article className="recommendation-panel" key={item.id}>
            <div className="recommendation-panel-header"><div className="recommendation-icon"><Lightbulb size={20} /></div><div><StatusBadge status={recommendation.priority} /><h2>{recommendation.title}</h2><p>{recommendation.domain}</p></div></div>
            <p>{recommendation.description}</p>
            <div className="recommendation-analysis"><strong>{text.analysis}</strong><span>{recommendation.analysis}</span></div>
            <div className="recommendation-analysis"><strong>{text.action}</strong><span>{recommendation.action}</span></div>
            <div className="recommendation-source"><Database size={15} /><span><strong>{text.source}:</strong> {isArabic ? item.sourceAr : item.source}</span></div>
            {item.evidenceFile && <div className="recommendation-source"><FileSearch size={15} /><span><strong>{isArabic ? "ملف الدليل:" : "Evidence file:"}</strong> {item.evidenceFile}{item.evidenceLocation ? ` · ${item.evidenceLocation}` : ""}</span></div>}
            <div className="recommendation-footer"><span>{recommendation.reference}</span><span>{isArabic ? "الثقة" : "Confidence"}: {item.confidence}%</span><StatusBadge status={recommendation.status === "Resolved" ? text.resolved : recommendation.status} /></div>
            {item.owner && <p className="recommendation-meta">{text.owner}: <strong>{item.owner}</strong></p>}
            {item.dueDate && <p className="recommendation-meta">{text.dueDate}: <strong>{formatGregorianDate(item.dueDate, language)}</strong></p>}
            <div className="card-actions"><button disabled={saving || !canEdit} onClick={() => openDialog("plan", item)} type="button">{text.createPlan}</button><button disabled={saving || !canEdit} onClick={() => openDialog("owner", item)} type="button">{text.assignOwner}</button><button disabled={saving || !canEdit || item.status === "Resolved"} onClick={() => resolveItem(item)} type="button">{text.resolve}</button></div>
          </article>;
        })}
      </section>
      {filteredItems.length === 0 && <div className="enterprise-card empty-filter-result">{text.noItems}</div>}
      {dialog && <div className="modal-scrim" role="presentation" onMouseDown={() => !saving && setDialog(null)}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="action-modal-title" onMouseDown={(event) => event.stopPropagation()}><div className="action-modal-header"><h2 id="action-modal-title">{dialog.type === "plan" ? text.planTitle : text.ownerTitle}</h2><button aria-label={text.cancel} className="icon-button" disabled={saving} onClick={() => setDialog(null)} type="button"><X size={18} /></button></div><p>{trRecommendation(dialog.item, language).title}</p><form onSubmit={saveDialog}><label><span>{dialog.type === "plan" ? text.dueDate : text.owner}</span><input autoFocus defaultValue={dialog.type === "plan" ? dialog.item.dueDate : dialog.item.owner} name="actionValue" required type={dialog.type === "plan" ? "date" : "text"} /></label><div className="action-modal-actions"><button className="secondary-action" disabled={saving} onClick={() => setDialog(null)} type="button">{text.cancel}</button><button className="primary-action" disabled={saving} type="submit">{saving ? (isArabic ? "جار الحفظ..." : "Saving...") : text.save}</button></div></form></section></div>}
      {toast && <div className="app-toast" role="status">{toast}</div>}
    </div>
  );
}

export default Recommendations;
