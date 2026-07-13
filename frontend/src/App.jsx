import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import { LanguageProvider } from "./language";
import { AuthGate, AuthProvider } from "./auth";
import "./App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assessment = lazy(() => import("./pages/governance/Assessment"));
const DomainDetails = lazy(() => import("./pages/governance/DomainDetails"));
const Recommendations = lazy(() => import("./pages/governance/Recommendations"));
const Compliance = lazy(() => import("./pages/governance/Compliance"));
const DataAssets = lazy(() => import("./pages/data/DataAssets"));
const DataAssetDetails = lazy(() => import("./pages/data/DataAssetDetails"));
const Policies = lazy(() => import("./pages/data/Policies"));
const DataQualityReport = lazy(() => import("./pages/DataQualityReport"));
const AIEvidenceAnalyzer = lazy(() => import("./pages/AIEvidenceAnalyzer"));
const AuditLog = lazy(() => import("./pages/system/AuditLog"));
const Users = lazy(() => import("./pages/system/Users"));

function App() {
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("ndmo-language") || "en"
  );
  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [isArabic, language]);

  const toggleLanguage = () => {
    setLanguage((currentLanguage) => {
      const nextLanguage = currentLanguage === "ar" ? "en" : "ar";
      window.localStorage.setItem("ndmo-language", nextLanguage);
      return nextLanguage;
    });
  };

  return (
    <LanguageProvider language={language}>
      <AuthProvider>
        <AuthGate language={language}>
          <Suspense fallback={<div className="auth-loading">{isArabic ? "جار تحميل الصفحة..." : "Loading page..."}</div>}>
          <Routes>
        <Route
          element={
            <AppLayout language={language} onToggleLanguage={toggleLanguage} />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/assessment/:domainId" element={<DomainDetails />} />
          <Route path="/evidence" element={<AIEvidenceAnalyzer language={language} />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/data-assets" element={<DataAssets />} />
          <Route path="/data-assets/:assetId" element={<DataAssetDetails />} />
          <Route path="/data-quality" element={<DataQualityReport language={language} />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/users" element={<Users />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
          </Routes>
          </Suspense>
        </AuthGate>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
