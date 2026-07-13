import { useEffect, useState } from "react";
import { FileSearch, Save } from "lucide-react";
import { useParams } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import ScoreProgress from "../../components/common/ScoreProgress";
import StatusBadge from "../../components/common/StatusBadge";
import { domainDetailsCopy } from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getAssessmentDetails, getAssessmentSummary, submitAssessmentAnswer } from "../../services/ndmoService";
import { formatGregorianDateTime } from "../../utils/dateFormat";
import { useAuth } from "../../authContext";


const statusFor = (score, answered) => {
  if (!answered) return "Needs Review";
  if (score >= 85) return "Compliant";
  if (score < 60) return "Non-Compliant";
  return "Partially Compliant";
};


function DomainDetails() {
  const { domainId } = useParams();
  const { language, isArabic } = useLanguage();
  const { user } = useAuth();
  const text = domainDetailsCopy[language] || domainDetailsCopy.en;
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAssessmentSummary(), getAssessmentDetails(domainId)])
      .then(([summaryData, detailData]) => {
        if (!active) return;
        setSummary(summaryData.domains_summary?.find((item) => String(item.domain_id) === String(domainId)) || null);
        setQuestions(detailData.questions || []);
        setAnswers(Object.fromEntries((detailData.questions || []).map((question) => [question.id, {
          answer_value: question.manual_answer || question.effective_answer || "",
          notes: question.manual_notes || "",
        }])));
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setSummary(null);
        setQuestions([]);
        setError(requestError?.response?.data?.detail || requestError.message);
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [domainId]);

  const saveAnswer = async (questionId) => {
    const value = answers[questionId];
    if (!value?.answer_value) return;
    setSavingId(questionId);
    setError("");
    try {
      await submitAssessmentAnswer({ question_id: questionId, ...value });
      const [summaryData, detailData] = await Promise.all([getAssessmentSummary(), getAssessmentDetails(domainId)]);
      setSummary(summaryData.domains_summary?.find((item) => String(item.domain_id) === String(domainId)) || null);
      setQuestions(detailData.questions || []);
      setAnswers(Object.fromEntries((detailData.questions || []).map((question) => [question.id, {
        answer_value: question.manual_answer || question.effective_answer || "",
        notes: question.manual_notes || "",
      }])));
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  if (!loaded) return null;
  if (!summary) return <EmptyState icon={FileSearch} title={isArabic ? "لا توجد بيانات لهذا المجال" : "No domain data"} description={error || (isArabic ? "لا توجد متطلبات متاحة لهذا المجال." : "No requirements are available for this domain.")} />;

  const score = Number(summary.domain_score || 0);
  const title = isArabic ? summary.domain_name_ar : summary.domain_name_en;
  const canReview = ["admin", "analyst", "reviewer"].includes(user?.role);

  return <div className="page-stack">
    <PageHeader eyebrow={text.eyebrow} title={title} subtitle={isArabic ? "كل قرار أدناه مرتبط بمصدره الفعلي، ويمكن للمراجعة البشرية اعتماد الإجابة أو تعديلها." : "Every decision below is linked to its actual source and can be overridden by an authorized reviewer."} />
    {error && <div className="page-error-banner">{error}</div>}
    <section className="enterprise-card domain-detail-header"><div><span>{text.complianceScore}</span><strong>{score}%</strong><StatusBadge status={statusFor(score, Number(summary.answered_questions) > 0)} /></div><ScoreProgress score={score} label={isArabic ? `${summary.answered_questions} من ${summary.total_questions} مجاب` : `${summary.answered_questions} of ${summary.total_questions} answered`} /></section>
    <section className="requirement-list">{questions.map((question) => {
      const answered = question.effective_score !== null && question.effective_score !== undefined;
      const questionScore = Number(question.effective_score || 0);
      const current = answers[question.id] || { answer_value: "", notes: "" };
      return <details className="requirement-card" key={question.id}>
        <summary><div><strong>{question.question_code}</strong><h2>{isArabic ? question.question_text_ar : question.question_text_en}</h2><p>{question.evidence_required ? (isArabic ? "يتطلب دليلًا" : "Evidence required") : (isArabic ? "لا يتطلب دليلًا" : "Evidence optional")}</p></div><div className="requirement-summary-meta"><StatusBadge status={statusFor(questionScore, answered)} /><span>{answered ? `${questionScore}%` : "—"}</span></div></summary>
        <div className="requirement-body requirement-evidence-grid">
          <article>
            <h3>{isArabic ? "القرار الفعلي" : "Effective decision"}</h3>
            <p>{answered ? (isArabic ? ({ yes: "ممتثل", partial: "ممتثل جزئيًا", no: "غير ممتثل" }[question.effective_answer] || question.effective_answer) : question.effective_answer) : (isArabic ? "لا توجد إجابة بعد." : "No answer yet.")}</p>
            <small>{question.decision_source === "manual" ? (isArabic ? "المصدر: مراجعة بشرية" : "Source: manual review") : question.decision_source === "evidence_analysis" ? (isArabic ? "المصدر: تحليل الدليل" : "Source: evidence analysis") : (isArabic ? "بدون مصدر" : "No source")}</small>
            {question.reason && <><h3>{isArabic ? "سبب قرار التحليل" : "Analysis reasoning"}</h3><p>{question.reason}</p></>}
            {question.confidence !== null && question.confidence !== undefined && <small>{isArabic ? `درجة الثقة: ${question.confidence}%` : `Confidence: ${question.confidence}%`}</small>}
          </article>
          <article>
            <h3>{text.supporting}</h3>
            {question.evidence_file ? <>
              <p><strong>{question.evidence_file}</strong></p>
              {question.evidence_location && <small>{isArabic ? "الموضع: " : "Location: "}{question.evidence_location}</small>}
              {question.evidence_text && <blockquote>{question.evidence_text}</blockquote>}
              {question.analyzed_at && <small>{isArabic ? "تاريخ التحليل: " : "Analyzed: "}{formatGregorianDateTime(question.analyzed_at, language)}</small>}
            </> : <p>{isArabic ? "لا يوجد دليل مرتبط بهذا المتطلب." : "No evidence is linked to this requirement."}</p>}
          </article>
          <article className="manual-review-card">
            <h3>{isArabic ? "المراجعة البشرية" : "Manual review"}</h3>
            <label><span>{isArabic ? "القرار" : "Decision"}</span><select disabled={!canReview} onChange={(event) => setAnswers((items) => ({ ...items, [question.id]: { ...current, answer_value: event.target.value } }))} value={current.answer_value}><option value="">{isArabic ? "اختيار" : "Select"}</option><option value="yes">{isArabic ? "ممتثل" : "Compliant"}</option><option value="partial">{isArabic ? "ممتثل جزئيًا" : "Partially compliant"}</option><option value="no">{isArabic ? "غير ممتثل" : "Non-compliant"}</option></select></label>
            <label><span>{isArabic ? "ملاحظات المراجعة" : "Review notes"}</span><textarea disabled={!canReview} onChange={(event) => setAnswers((items) => ({ ...items, [question.id]: { ...current, notes: event.target.value } }))} value={current.notes} /></label>
            <button className="primary-action" disabled={!canReview || !current.answer_value || savingId === question.id} onClick={() => saveAnswer(question.id)} type="button"><Save size={16} />{savingId === question.id ? (isArabic ? "جار الحفظ..." : "Saving...") : (isArabic ? "حفظ المراجعة" : "Save review")}</button>
          </article>
        </div>
      </details>;
    })}</section>
  </div>;
}

export default DomainDetails;
