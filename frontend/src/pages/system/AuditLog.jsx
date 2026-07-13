import { useEffect, useState } from "react";
import { History } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { useLanguage } from "../../language";
import { getAuditLog } from "../../services/ndmoService";
import { formatGregorianDateTime } from "../../utils/dateFormat";


const actionLabels = {
  bootstrap_admin: "إنشاء حساب الإدارة",
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
  create_user: "إنشاء حساب مستخدم",
  update_user: "تحديث حساب مستخدم",
  upload_evidence: "رفع دليل",
  save_manual_answer: "حفظ مراجعة بشرية",
  save_remediation: "تحديث خطة معالجة",
  analyze_dataset: "تحليل جودة بيانات",
};


function AuditLog() {
  const { language, isArabic } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getAuditLog().then((data) => setEntries(data.entries || [])).catch((requestError) => setError(requestError?.response?.data?.detail || requestError.message));
  }, []);

  return <div className="page-stack">
    <PageHeader eyebrow={isArabic ? "الأمان والتتبع" : "Security & Traceability"} title={isArabic ? "سجل التدقيق" : "Audit Log"} subtitle={isArabic ? "سجل زمني للعمليات الحساسة ومن نفذتها، محفوظ في قاعدة البيانات." : "A database-backed timeline of sensitive actions and who performed them."} />
    {error ? <EmptyState icon={History} title={isArabic ? "تعذر عرض السجل" : "Audit log unavailable"} description={error} /> : entries.length === 0 ? <EmptyState icon={History} title={isArabic ? "لا توجد عمليات مسجلة" : "No logged actions"} description={isArabic ? "ستظهر هنا عمليات الدخول والرفع والمراجعة والمعالجة." : "Sign-ins, uploads, reviews, and remediation changes will appear here."} /> : <section className="enterprise-card"><div className="table-shell"><table className="enterprise-table"><thead><tr>{(isArabic ? ["التاريخ الميلادي", "الحساب", "العملية", "نوع السجل", "المعرف", "التفاصيل"] : ["Gregorian date", "User", "Action", "Entity", "ID", "Details"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{formatGregorianDateTime(entry.created_at, language)}</td><td>{entry.display_name || entry.username || "—"}</td><td><strong>{isArabic ? actionLabels[entry.action] || entry.action : entry.action}</strong></td><td>{entry.entity_type}</td><td>{entry.entity_id || "—"}</td><td><code>{JSON.stringify(entry.details || {})}</code></td></tr>)}</tbody></table></div></section>}
  </div>;
}

export default AuditLog;
