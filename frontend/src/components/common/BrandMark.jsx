import logoMark from "../../assets/ndmo-logo.svg";
import { useLanguage } from "../../language";

function BrandMark({ collapsed = false }) {
  const { isArabic } = useLanguage();

  return (
    <div className="brand-mark">
      <div className="brand-symbol" aria-hidden="true">
        <img src={logoMark} alt="" />
      </div>
      {!collapsed && (
        <div className="brand-copy">
          <strong>{isArabic ? "منصة NDMO" : "NDMO Platform"}</strong>
          <span>{isArabic ? "حوكمة بيانات محلية قابلة للتتبع" : "Traceable Local Data Governance"}</span>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
