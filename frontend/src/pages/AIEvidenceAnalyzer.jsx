import { useEffect, useMemo, useRef, useState } from "react";
import { aiCopy, getAnswerLabel } from "../i18n";
import {
  analyzeAllEvidence,
  analyzeDomainEvidence,
  analyzeExistingAllEvidence,
} from "../services/evidenceService";
import { getDomains, getTrainingDataset, saveAiFeedback } from "../services/ndmoService";
import { formatGregorianDateTime } from "../utils/dateFormat";
import { getErrorMessage } from "../services/apiClient";
import { useAuth } from "../authContext";
import "./AIEvidenceAnalyzer.css";

const SAFE_ANALYSIS_QUESTION_LIMIT = 3;
const ANALYSIS_TIMEOUT_MS = 180000;
const ALL_ANALYSIS_TIMEOUT_MS = 1800000;

function getAnswerClass(answer) {
  if (answer === "yes") return "answer-yes";
  if (answer === "partial") return "answer-partial";
  return "answer-no";
}

function normalizeTrainingKeyPart(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function getTrainingExampleKey({
  questionId,
  evidenceId,
  evidenceText,
  evidenceLocation,
  correctedAnswer,
}) {
  return [
    questionId,
    evidenceId,
    normalizeTrainingKeyPart(evidenceText),
    normalizeTrainingKeyPart(evidenceLocation),
    normalizeTrainingKeyPart(correctedAnswer).toLowerCase(),
  ].join("::");
}

function getEvidenceId(analysisResult) {
  return analysisResult?.evidence?.id || analysisResult?.evidence_id;
}

function buildSummaryFromQuestions(questions) {
  const totalQuestions = questions.length;
  const yesCount = questions.filter((question) => question.ai_answer === "yes").length;
  const partialCount = questions.filter((question) => question.ai_answer === "partial").length;
  const noCount = questions.filter((question) => question.ai_answer === "no").length;
  const totalScore = questions.reduce((sum, question) => {
    if (question.ai_answer === "yes") return sum + 100;
    if (question.ai_answer === "partial") return sum + 50;
    return sum;
  }, 0);
  const score = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) / 100 : 0;

  return {
    total_questions: totalQuestions,
    yes_count: yesCount,
    partial_count: partialCount,
    no_count: noCount,
    domain_score: score,
    ndi_score: score,
  };
}

function mergeAllAnalysisResults(currentResult, batchResult) {
  if (!currentResult) return batchResult;

  const domainsById = new Map();

  [...(currentResult.domains || []), ...(batchResult.domains || [])].forEach((domainResult) => {
    const domainId = domainResult.domain?.id || domainResult.domain?.name_en || "unknown";
    const existingDomain = domainsById.get(domainId) || {
      ...domainResult,
      questions: [],
    };
    const existingQuestionKeys = new Set(
      existingDomain.questions.map((question) => question.result_id || question.question_id)
    );

    (domainResult.questions || []).forEach((question) => {
      const questionKey = question.result_id || question.question_id;
      if (!existingQuestionKeys.has(questionKey)) {
        existingDomain.questions.push(question);
        existingQuestionKeys.add(questionKey);
      }
    });

    existingDomain.summary = buildSummaryFromQuestions(existingDomain.questions);
    domainsById.set(domainId, existingDomain);
  });

  const domains = Array.from(domainsById.values());
  const allQuestions = domains.flatMap((domain) => domain.questions || []);
  const overallSummary = buildSummaryFromQuestions(allQuestions);
  const totalAvailable =
    batchResult.analysis_limit?.total_available_questions ||
    currentResult.analysis_limit?.total_available_questions ||
    allQuestions.length;
  const nextOffset =
    batchResult.analysis_limit?.next_offset ??
    Math.min(allQuestions.length, totalAvailable);

  return {
    ...currentResult,
    ...batchResult,
    evidence: currentResult.evidence || batchResult.evidence,
    evidence_id: getEvidenceId(currentResult) || getEvidenceId(batchResult),
    domains,
    overall_ndi_score: overallSummary.ndi_score,
    overall_summary: overallSummary,
    analysis_limit: {
      ...(batchResult.analysis_limit || {}),
      analyzed_questions: allQuestions.length,
      next_offset: nextOffset,
      total_available_questions: totalAvailable,
      limited: nextOffset < totalAvailable,
    },
  };
}

function SummaryTile({ label, value }) {
  return (
    <div className="ai-summary-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AIEvidenceAnalyzer({ language }) {
  const text = aiCopy[language] || aiCopy.en;
  const { user } = useAuth();
  const canAnalyze = ["admin", "analyst"].includes(user?.role);
  const canReview = ["admin", "analyst", "reviewer"].includes(user?.role);
  const [domains, setDomains] = useState([]);
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [analysisMode, setAnalysisMode] = useState("domain");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const [trainingDataset, setTrainingDataset] = useState(null);
  const [loadingTrainingDataset, setLoadingTrainingDataset] = useState(false);
  const analyzeAbortControllerRef = useRef(null);

  const fetchTrainingDataset = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoadingTrainingDataset(true);
    }

    try {
      const data = await getTrainingDataset();
      setTrainingDataset(data);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoadingTrainingDataset(false);
      }
    }
  };

  useEffect(() => {
    async function fetchDomains() {
      try {
        const data = await getDomains();
        const domainList = data.domains || [];
        setDomains(domainList);

        if (domainList.length > 0) {
          setSelectedDomainId(String(domainList[0].id));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDomains(false);
      }
    }

    async function fetchInitialTrainingDataset() {
      try {
        const data = await getTrainingDataset();
        setTrainingDataset(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchDomains();
    fetchInitialTrainingDataset();
  }, [text.errors.loadDomains, text.errors.loadTraining]);

  const questions = useMemo(() => {
    if (!analysisResult) return [];

    if (Array.isArray(analysisResult.questions)) {
      return analysisResult.questions;
    }

    if (Array.isArray(analysisResult.domains)) {
      return analysisResult.domains.flatMap((domain) =>
        (domain.questions || []).map((question) => ({
          ...question,
          domain_name_en: domain.domain?.name_en || "",
          domain_name_ar: domain.domain?.name_ar || "",
        }))
      );
    }

    return [];
  }, [analysisResult]);

  const summary = useMemo(() => {
    if (!analysisResult) return null;
    return analysisResult.summary || analysisResult.overall_summary || null;
  }, [analysisResult]);

  const savedTrainingKeys = useMemo(() => {
    const examples = trainingDataset?.examples || [];

    return new Set(
      examples.map((example) =>
        getTrainingExampleKey({
          questionId: example.question_id,
          evidenceId: example.evidence_id,
          evidenceText: example.evidence_text,
          evidenceLocation: example.evidence_location,
          correctedAnswer: example.corrected_answer,
        })
      )
    );
  }, [trainingDataset]);

  const handleCancelAnalyze = () => {
    analyzeAbortControllerRef.current?.abort();
  };

  const handleAnalyze = async () => {
    if (analyzing) {
      handleCancelAnalyze();
      return;
    }

    if (!selectedFile) {
      setError(text.errors.chooseFile);
      return;
    }

    if (analysisMode === "domain" && !selectedDomainId) {
      setError(text.errors.chooseDomain);
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalysisResult(null);
    setFeedbackStatus({});

    const formData = new FormData();
    const responseLanguage = language === "ar" ? "Arabic" : "English";
    formData.append("evidence_type", "Document");
    formData.append("response_language", responseLanguage);
    formData.append("max_questions", String(SAFE_ANALYSIS_QUESTION_LIMIT));
    formData.append("question_offset", "0");
    formData.append("file", selectedFile);

    const shouldAnalyzeDomain = analysisMode === "domain";
    if (shouldAnalyzeDomain) {
      formData.append("domain_id", selectedDomainId);
    }

    const controller = new AbortController();
    analyzeAbortControllerRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, shouldAnalyzeDomain ? ANALYSIS_TIMEOUT_MS : ALL_ANALYSIS_TIMEOUT_MS);

    try {
      if (shouldAnalyzeDomain) {
        const data = await analyzeDomainEvidence(formData, controller.signal);
        setAnalysisResult(data);
      } else {
        let mergedResult = await analyzeAllEvidence(formData, controller.signal);
        setAnalysisResult(mergedResult);

        while (
          mergedResult.analysis_limit?.limited &&
          !controller.signal.aborted
        ) {
          const evidenceId = getEvidenceId(mergedResult);
          if (!evidenceId) {
            throw new Error(text.errors.missingEvidenceId);
          }

          const nextBatch = await analyzeExistingAllEvidence(
            {
              evidenceId,
              responseLanguage,
              maxQuestions: SAFE_ANALYSIS_QUESTION_LIMIT,
              questionOffset: mergedResult.analysis_limit.next_offset,
            },
            controller.signal
          );
          mergedResult = mergeAllAnalysisResults(mergedResult, nextBatch);
          setAnalysisResult(mergedResult);
        }
      }

      fetchTrainingDataset({ showLoading: false });
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          timedOut ? text.errors.analysisTimeout : text.errors.analysisCancelled
        );
      } else {
        const message = getErrorMessage(err, text.errors.analysisFailed);
        const limitMatch = message.match(/^File exceeds the (\d+) MB limit$/);
        setError(
          message === "Network Error"
            ? text.errors.networkError
            : limitMatch
              ? text.errors.fileTooLarge(limitMatch[1])
              : message
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      analyzeAbortControllerRef.current = null;
      setAnalyzing(false);
    }
  };

  const handleFeedback = async (question, correctedAnswer) => {
    const evidenceId = getEvidenceId(analysisResult);
    const questionId = question.question_id;

    if (!evidenceId) {
      setError(text.errors.missingEvidenceId);
      return;
    }

    if (!questionId) {
      setError(text.errors.feedbackFailed);
      return;
    }

    const key = `${question.result_id || questionId}-${correctedAnswer}`;
    const trainingKey = getTrainingExampleKey({
      questionId,
      evidenceId,
      evidenceText: question.evidence_text,
      evidenceLocation: question.evidence_location,
      correctedAnswer,
    });

    if (savedTrainingKeys.has(trainingKey) || feedbackStatus[key] === "saved") {
      setFeedbackStatus((current) => ({ ...current, [key]: "saved" }));
      return;
    }

    setFeedbackStatus((current) => ({ ...current, [key]: "saving" }));
    setError("");

    const formData = new FormData();
    formData.append("question_id", questionId);
    formData.append("evidence_id", evidenceId);
    formData.append("evidence_text", question.evidence_text || "");
    formData.append("evidence_location", question.evidence_location || "");
    formData.append("predicted_answer", question.ai_answer || "");
    formData.append("corrected_answer", correctedAnswer);
    formData.append(
      "notes",
      language === "ar"
        ? "تم الحفظ من واجهة محلل الأدلة الذكي"
        : "Saved from AI Evidence Analyzer UI"
    );

    try {
      await saveAiFeedback(formData);
      setFeedbackStatus((current) => ({ ...current, [key]: "saved" }));
      fetchTrainingDataset({ showLoading: false });
    } catch (err) {
      setFeedbackStatus((current) => ({ ...current, [key]: "error" }));
      setError(err.message);
    }
  };

  return (
    <main className="ai-analyzer-page">
      <section className="ai-analyzer-header">
        <div>
          <p className="ai-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
        </div>
      </section>

      <section className="ai-control-panel">
        <div className="ai-field-group">
          <label>{text.scope}</label>
          <div className="ai-segmented-control" aria-label={text.scopeAria}>
            <button
              className={analysisMode === "domain" ? "active" : ""}
              type="button"
              onClick={() => setAnalysisMode("domain")}
            >
              {text.domainScope}
            </button>
            <button
              className={analysisMode === "all" ? "active" : ""}
              type="button"
              onClick={() => setAnalysisMode("all")}
            >
              {text.allScope}
            </button>
          </div>
        </div>

        <div className="ai-field-group">
          <label htmlFor="domain-select">{text.domain}</label>
          <select
            id="domain-select"
            value={selectedDomainId}
            onChange={(event) => setSelectedDomainId(event.target.value)}
            disabled={analysisMode === "all" || loadingDomains}
          >
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {language === "ar"
                  ? `${domain.name_ar} / ${domain.name_en}`
                  : `${domain.name_en} / ${domain.name_ar}`}
              </option>
            ))}
          </select>
        </div>

        <div className="ai-field-group ai-file-field">
          <label htmlFor="evidence-file">{text.evidenceFile}</label>
          <input
            id="evidence-file"
            type="file"
            accept=".xlsx,.xls,.xlsm,.pdf,.csv,.txt"
            onChange={(event) => setSelectedFile(event.target.files[0] || null)}
            disabled={!canAnalyze}
          />
        </div>

        <button
          className="ai-primary-button"
          type="button"
          onClick={handleAnalyze}
          disabled={loadingDomains || !canAnalyze}
        >
          {!canAnalyze ? text.readOnly : analyzing ? text.cancel : text.analyze}
        </button>
      </section>

      {selectedFile && (
        <p className="ai-selected-file">{text.selectedFile}: {selectedFile.name}</p>
      )}

      {error && <p className="ai-error">{error}</p>}

      {analyzing && (
        <p className="ai-selected-file">{text.analyzing}</p>
      )}

      {analysisResult?.analysis_limit?.limited && (
        <p className="ai-selected-file">
          {text.analysisLimitNotice(
            analysisResult.analysis_limit.analyzed_questions,
            analysisResult.analysis_limit.total_available_questions
          )}
        </p>
      )}

      {summary && (
        <section className="ai-summary-grid" aria-label="Analysis summary">
          <SummaryTile label={text.ndiScore} value={`${summary.ndi_score}%`} />
          <SummaryTile label={text.questions} value={summary.total_questions} />
          <SummaryTile label={text.yes} value={summary.yes_count} />
          <SummaryTile label={text.partial} value={summary.partial_count} />
          <SummaryTile label={text.no} value={summary.no_count} />
        </section>
      )}

      {analysisResult && (
        <section className="ai-result-section">
          <div className="ai-result-title">
            <div>
              <h2>{text.assessmentResults}</h2>
              <p>
                {analysisResult.evidence?.file_name || text.evidenceFileFallback} ·{" "}
                {text.questionCount(questions.length)}
              </p>
            </div>
          </div>

          <div className="ai-table-wrap">
            <table className="ai-results-table">
              <thead>
                <tr>
                  <th>{text.tableQuestion}</th>
                  <th>{text.tableAnswer}</th>
                  <th>{text.tableConfidence}</th>
                  <th>{text.tableReason}</th>
                  <th>{text.tableEvidence}</th>
                  <th>{text.tableCorrection}</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.result_id}>
                    <td>
                      <strong>{question.question_code}</strong>
                      <span>{question.question_text}</span>
                      {question.domain_name_en && (
                        <em>{question.domain_name_en}</em>
                      )}
                    </td>
                    <td>
                      <span className={`ai-answer-pill ${getAnswerClass(question.ai_answer)}`}>
                        {getAnswerLabel(question.ai_answer, language)}
                      </span>
                    </td>
                    <td>{question.confidence}%</td>
                    <td>{question.reason}</td>
                    <td>
                      <span>{question.evidence_text || text.noMatchingText}</span>
                      {question.evidence_location && (
                        <small>{question.evidence_location}</small>
                      )}
                    </td>
                    <td>
                      <div className="ai-feedback-buttons">
                        {["yes", "partial", "no"].map((answer) => {
                          const evidenceId = getEvidenceId(analysisResult);
                          const key = `${question.result_id || question.question_id}-${answer}`;
                          const trainingKey = getTrainingExampleKey({
                            questionId: question.question_id,
                            evidenceId,
                            evidenceText: question.evidence_text,
                            evidenceLocation: question.evidence_location,
                            correctedAnswer: answer,
                          });
                          const isSaved =
                            feedbackStatus[key] === "saved" ||
                            savedTrainingKeys.has(trainingKey);
                          const isSaving = feedbackStatus[key] === "saving";

                          return (
                            <button
                              className={isSaved ? "saved" : ""}
                              key={answer}
                              type="button"
                              onClick={() => handleFeedback(question, answer)}
                              disabled={isSaving || !canReview}
                            >
                              {isSaved
                                ? `${getAnswerLabel(answer, language)} ✓`
                                : getAnswerLabel(answer, language)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="ai-training-section">
        <div className="ai-result-title">
          <div>
            <h2>{text.trainingDataset}</h2>
            <p>
              {text.trainingCount(trainingDataset?.total_examples || 0)}
            </p>
          </div>
          <button
            className="ai-secondary-button"
            type="button"
            onClick={fetchTrainingDataset}
            disabled={loadingTrainingDataset}
          >
            {loadingTrainingDataset ? text.refreshing : text.refresh}
          </button>
        </div>

        {trainingDataset?.examples?.length > 0 ? (
          <div className="ai-table-wrap">
            <table className="ai-training-table">
              <thead>
                <tr>
                  <th>{text.tableQuestion}</th>
                  <th>{text.tableEvidence}</th>
                  <th>{text.predicted}</th>
                  <th>{text.corrected}</th>
                  <th>{text.created}</th>
                </tr>
              </thead>
              <tbody>
                {trainingDataset.examples.slice(-8).reverse().map((example) => (
                  <tr key={example.id}>
                    <td>
                      <strong>Q{example.question_id}</strong>
                      <span>
                        {(language === "ar"
                          ? example.question_text_ar || example.question_text_en
                          : example.question_text_en || example.question_text_ar) ||
                          text.questionTextUnavailable}
                      </span>
                    </td>
                    <td>
                      <span>{example.evidence_text || text.noEvidenceText}</span>
                      {example.evidence_location && (
                        <small>{example.evidence_location}</small>
                      )}
                    </td>
                    <td>
                      <span className={`ai-answer-pill ${getAnswerClass(example.predicted_answer)}`}>
                        {getAnswerLabel(example.predicted_answer, language)}
                      </span>
                    </td>
                    <td>
                      <span className={`ai-answer-pill ${getAnswerClass(example.corrected_answer)}`}>
                        {getAnswerLabel(example.corrected_answer, language)}
                      </span>
                    </td>
                    <td>{formatGregorianDateTime(example.created_at, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ai-empty-training">
            {text.emptyTraining}
          </div>
        )}
      </section>
    </main>
  );
}

export default AIEvidenceAnalyzer;
