import { apiClient } from "./apiClient";

export async function analyzeDomainEvidence(formData, signal) {
  const response = await apiClient.post("/api/ndmo/upload-and-analyze-domain", formData, { signal });
  return response.data;
}

export async function analyzeAllEvidence(formData, signal) {
  const response = await apiClient.post("/api/ndmo/upload-and-analyze-all", formData, { signal });
  return response.data;
}

export async function analyzeExistingAllEvidence({
  evidenceId,
  responseLanguage,
  maxQuestions,
  questionOffset,
}, signal) {
  const formData = new FormData();
  formData.append("evidence_id", evidenceId);
  formData.append("response_language", responseLanguage);
  formData.append("max_questions", String(maxQuestions));
  formData.append("question_offset", String(questionOffset));

  const response = await apiClient.post("/api/ndmo/analyze-all-evidence", formData, { signal });
  return response.data;
}
