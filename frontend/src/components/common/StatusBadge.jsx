import { trStatus } from "../../enterpriseI18n";
import { useLanguage } from "../../language";

function getTone(status = "") {
  const normalized = status.toLowerCase();
  if (["حرج", "مرفوض", "غير ممتثل", "منخفض"].some((term) => normalized.includes(term))) return "danger";
  if (["عال", "مراجعة", "جزئي", "مسودة", "متوسط"].some((term) => normalized.includes(term))) return "warning";
  if (["مقبول", "معتمد", "ممتثل", "نشط", "مرتفع"].some((term) => normalized.includes(term))) return "success";
  if (normalized.includes("critical") || normalized.includes("rejected") || normalized.includes("non")) return "danger";
  if (normalized.includes("high") || normalized.includes("review") || normalized.includes("partial") || normalized.includes("draft")) return "warning";
  if (normalized.includes("accepted") || normalized.includes("approved") || normalized.includes("compliant") || normalized.includes("active")) return "success";
  return "neutral";
}

function StatusBadge({ status, tone }) {
  const { language } = useLanguage();
  return (
    <span className={`status-badge status-${tone || getTone(status)}`}>
      {trStatus(status, language)}
    </span>
  );
}

export default StatusBadge;
