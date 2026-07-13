import { apiClient } from "./apiClient";

export async function getDomains() {
  const response = await apiClient.get("/api/ndmo/domains");
  return response.data;
}

export async function getTrainingDataset() {
  const response = await apiClient.get("/api/ndmo/training-dataset");
  return response.data;
}

export async function getAnalyzerInfo() {
  const response = await apiClient.get("/api/ndmo/model-info", { timeout: 6000 });
  return response.data;
}

export async function getAssessmentSummary() {
  const response = await apiClient.get("/api/ndmo/assessment-summary", { timeout: 6000 });
  return response.data;
}

export async function getAssessmentDetails(domainId) {
  const response = await apiClient.get(`/api/ndmo/assessment-details/${domainId}`, { timeout: 6000 });
  return response.data;
}

export async function submitAssessmentAnswer(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => formData.append(key, value ?? ""));
  const response = await apiClient.post("/api/ndmo/answers", formData);
  return response.data;
}

export async function saveRemediation(recommendationKey, payload) {
  const response = await apiClient.put(`/api/remediations/${recommendationKey}`, payload);
  return response.data;
}

export async function getAuditLog() {
  const response = await apiClient.get("/api/audit-log", { timeout: 6000 });
  return response.data;
}

export async function getAutoRecommendations() {
  const response = await apiClient.get("/auto-recommendations", { timeout: 6000 });
  return response.data;
}

export async function getBackendHealth() {
  const response = await apiClient.get("/health", { timeout: 3000 });
  return response.data;
}

export async function getQuestions() {
  const response = await apiClient.get("/api/ndmo/questions", { timeout: 6000 });
  return response.data;
}

export async function getEvidenceFiles() {
  const response = await apiClient.get("/api/ndmo/evidence-files", { timeout: 6000 });
  return response.data;
}

export async function saveAiFeedback(formData) {
  const response = await apiClient.post("/api/ndmo/ai-feedback", formData);
  return response.data;
}
