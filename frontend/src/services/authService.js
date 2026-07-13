import { apiClient } from "./apiClient";


export async function getAuthStatus() {
  const response = await apiClient.get("/api/auth/status", { timeout: 6000 });
  return response.data;
}

export async function bootstrapAccount(payload) {
  const response = await apiClient.post("/api/auth/bootstrap", payload);
  return response.data;
}

export async function loginAccount(payload) {
  const response = await apiClient.post("/api/auth/login", payload);
  return response.data;
}

export async function getCurrentAccount() {
  const response = await apiClient.get("/api/auth/me", { timeout: 6000 });
  return response.data;
}

export async function logoutAccount() {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
}

export async function getUsers() {
  const response = await apiClient.get("/api/auth/users");
  return response.data;
}

export async function createUser(payload) {
  const response = await apiClient.post("/api/auth/users", payload);
  return response.data;
}

export async function updateUser(userId, payload) {
  const response = await apiClient.patch(`/api/auth/users/${userId}`, payload);
  return response.data;
}

