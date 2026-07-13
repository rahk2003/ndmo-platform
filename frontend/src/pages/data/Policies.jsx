import { useEffect, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import KpiCard from "../../components/common/KpiCard";
import StatusBadge from "../../components/common/StatusBadge";
import { policiesCopy } from "../../enterpriseI18n";
import { useLanguage } from "../../language";
import { getEvidenceFiles } from "../../services/ndmoService";
import { formatGregorianDate } from "../../utils/dateFormat";
import { useAuth } from "../../authContext";

function Policies() {
  const { language, isArabic } = useLanguage();
  const { user } = useAuth();
  const canUpload = ["admin", "analyst"].includes(user?.role);
  const text = policiesCopy[language] || policiesCopy.en;
  const [policies, setPolicies] = useState([]);
  useEffect(() => {
    getEvidenceFiles().then((data) => setPolicies((data.files || []).filter((file) => {
      const value = `${file.evidence_type || ""} ${file.file_name || ""}`.toLowerCase();
      return value.includes("policy") || value.includes("سياس");
    }))).catch(() => setPolicies([]));
  }, []);

  return <div className="page-stack">
    <PageHeader eyebrow={text.eyebrow} title={text.title} subtitle={isArabic ? "تظهر فقط السياسات المسجلة فعليًا في قاعدة البيانات." : "Only policies actually stored in the database are shown."} actions={canUpload ? <Link className="primary-action compliance-header-action" to="/evidence"><Upload size={16} />{text.upload}</Link> : null} />
    {policies.length === 0 ? <EmptyState icon={FileText} title={isArabic ? "لا توجد سياسات مرفوعة" : "No uploaded policies"} description={isArabic ? "يمكن رفع سياسة من تحليل الأدلة لتظهر هنا بعد تسجيلها." : "Upload a policy through Evidence Analysis so it can be registered here."} /> : <>
      <section className="kpi-grid five">
        <KpiCard icon={FileText} label={text.total} value={policies.length} tone="blue" />
        <KpiCard icon={FileText} label={text.approved} value={policies.filter((item) => item.status === "Approved" || item.status === "Accepted").length} tone="green" />
        <KpiCard icon={FileText} label={text.underReview} value={policies.filter((item) => item.status === "Under Review").length} tone="indigo" />
        <KpiCard icon={FileText} label={text.draft} value={policies.filter((item) => item.status === "Draft").length} tone="blue" />
        <KpiCard icon={FileText} label={text.expired} value={policies.filter((item) => item.status === "Expired").length} tone="red" />
      </section>
      <section className="enterprise-card"><div className="table-shell"><table className="enterprise-table"><thead><tr>{(isArabic ? ["المعرف", "اسم الملف", "نوع الدليل", "الحالة", "تاريخ الرفع", "الإجراء"] : ["ID", "File", "Evidence type", "Status", "Uploaded", "Action"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{policies.map((policy) => <tr key={policy.id}><td>{policy.id}</td><td><strong>{policy.file_name}</strong></td><td>{policy.evidence_type}</td><td><StatusBadge status={policy.status} /></td><td>{formatGregorianDate(policy.uploaded_at, language)}</td><td><Link className="table-button" to="/evidence">{text.review}</Link></td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}
export default Policies;
