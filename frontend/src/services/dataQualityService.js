import { apiClient } from "./apiClient";

export async function getLatestDataQualityReport() {
  const response = await apiClient.get("/api/data-quality-report", { timeout: 6000 });
  return response.data;
}

export async function analyzeDataset(file, rules = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("rules_json", JSON.stringify(rules));

  const response = await apiClient.post("/api/analyze-dataset", formData);
  return response.data;
}

export async function getDataQualityReportDetails(reportId) {
  const response = await apiClient.get(`/api/data-quality-reports/${reportId}`);
  return response.data;
}

export async function downloadDataQualityIssues(reportId) {
  const response = await apiClient.get(`/api/data-quality-reports/${reportId}/issues.csv`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `data-quality-issues-${reportId}.csv`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function getDataQualityReports() {
  const response = await apiClient.get("/data-quality/reports", { timeout: 6000 });
  return response.data;
}
