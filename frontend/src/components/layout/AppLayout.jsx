import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Languages,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandMark from "../common/BrandMark";
import { navigationSections } from "../../constants/navigation";
import { layoutCopy } from "../../enterpriseI18n";
import { getAnalyzerInfo, getAutoRecommendations, getBackendHealth } from "../../services/ndmoService";
import { getEvidenceFiles } from "../../services/ndmoService";
import { getDataQualityReports } from "../../services/dataQualityService";
import { useAuth } from "../../authContext";

function getPageMeta(pathname, text) {
  if (pathname.startsWith("/assessment/")) {
    return text.pages.assessmentDetails;
  }

  if (pathname.startsWith("/data-assets/")) {
    return text.pages.assetDetails;
  }

  return text.pages[pathname] || text.pages["/dashboard"];
}

function AppLayout({ language, onToggleLanguage }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [analyzerProvider, setAnalyzerProvider] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResources, setSearchResources] = useState([]);
  const notificationsRef = useRef(null);
  const location = useLocation();
  const text = layoutCopy[language] || layoutCopy.en;
  const [pageTitle, breadcrumb] = useMemo(
    () => getPageMeta(location.pathname, text),
    [location.pathname, text]
  );
  const isArabic = language === "ar";
  const isDemo = analyzerProvider === "demo";
  const collapseIcon = isArabic ? ChevronRight : ChevronLeft;
  const ExpandIcon = isArabic ? ChevronLeft : ChevronRight;
  const CollapseIcon = collapsed ? ExpandIcon : collapseIcon;
  const unreadCount = notifications.filter((item) => !readNotifications.includes(item.id)).length;
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return [];
    const pages = navigationSections.flatMap((section) => section.items)
      .filter((item) => !item.roles || item.roles.includes(user?.role))
      .map((item) => ({ id: `page-${item.to}`, label: isArabic ? item.labelAr : item.label, detail: isArabic ? "صفحة" : "Page", to: item.to }));
    return [...pages, ...searchResources]
      .filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase().includes(query))
      .slice(0, 8);
  }, [isArabic, searchQuery, searchResources, user?.role]);

  useEffect(() => {
    getBackendHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
    getAnalyzerInfo()
      .then((data) => setAnalyzerProvider(data.provider || "rule_based"))
      .catch(() => setAnalyzerProvider(null));
    getAutoRecommendations()
      .then((data) => setNotifications((data.recommendations || []).filter((item) => item.status !== "Resolved").map((item, index) => ({
        id: `${item.category || "finding"}-${index}`,
        title: isArabic ? item.issue_ar || item.issue : item.issue,
        detail: isArabic ? item.recommendation_ar || item.recommendation : item.recommendation,
        to: "/recommendations",
        tone: "warning",
      }))))
      .catch(() => setNotifications([]));
    Promise.all([getDataQualityReports(), getEvidenceFiles()])
      .then(([reports, evidence]) => setSearchResources([
        ...(reports || []).map((item) => ({ id: `quality-${item.id}`, label: item.file_name, detail: isArabic ? "ملف جودة بيانات" : "Data quality file", to: `/data-assets/${item.id}` })),
        ...(evidence.files || []).map((item) => ({ id: `evidence-${item.id}`, label: item.file_name, detail: isArabic ? "ملف دليل" : "Evidence file", to: "/evidence" })),
      ]))
      .catch(() => setSearchResources([]));
  }, [isArabic]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const toggleNotifications = () => {
    setNotificationsOpen((current) => {
      const next = !current;
      if (next) setReadNotifications(notifications.map((item) => item.id));
      return next;
    });
  };

  return (
    <div className={`enterprise-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`enterprise-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <BrandMark collapsed={collapsed} />
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={text.closeNavigation}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label={text.mainNavigation}>
          {navigationSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.roles || item.roles.includes(user?.role));
            if (visibleItems.length === 0) return null;
            return (
            <div className="sidebar-section" key={section.label}>
              {!collapsed && (
                <p>{isArabic ? section.labelAr : section.label}</p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                    key={`${section.label}-${item.to}-${item.label}`}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={isArabic ? item.labelAr : item.label}
                  >
                    <Icon size={19} />
                    {!collapsed && <span>{isArabic ? item.labelAr : item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          );})}
        </nav>

        <div className={`local-ai-card ${backendOnline ? "" : "offline"}`}>
          <div className="local-ai-status">
            <span className={`status-dot ${backendOnline ? "" : "offline"}`} />
            {!collapsed && <strong>{text.localAiEngine}</strong>}
          </div>
          {!collapsed && (
            <>
              <p>{isDemo ? text.demoEngine : analyzerProvider === "ollama" ? "Qwen" : (isArabic ? "محلل القواعد" : "Rules analyzer")}</p>
              <span>{backendOnline ? (isDemo ? text.demoOnline : text.online) : text.offline}</span>
              <small>{isDemo ? text.demoProcessing : text.localProcessing}</small>
            </>
          )}
        </div>

        <button
          className="sidebar-collapse"
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={text.collapse}
        >
          <CollapseIcon size={18} />
          {!collapsed && <span>{text.collapse}</span>}
        </button>
      </aside>

      {mobileOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label={text.closeNavigation}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="enterprise-main">
        <header className="enterprise-topbar">
          <div className="topbar-title">
            <button
              className="mobile-menu-button"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={text.openNavigation}
            >
              <Menu size={20} />
            </button>
            <div>
              <p>{breadcrumb}</p>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="global-search-wrap">
              <label className="global-search"><Search size={17} /><input onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder={text.search} value={searchQuery} /></label>
              {searchQuery.trim() && <div className="global-search-results">{searchResults.length ? searchResults.map((result) => <Link key={result.id} onClick={() => setSearchQuery("")} to={result.to}><strong>{result.label}</strong><span>{result.detail}</span></Link>) : <p>{isArabic ? "لا توجد نتائج" : "No results"}</p>}</div>}
            </div>
            <span className={`topbar-ai-pill ${backendOnline ? "" : "offline"}`}>
              <ShieldCheck size={16} />
              {backendOnline ? (isDemo ? text.demoOnline : analyzerProvider === "ollama" ? text.qwenOnline : text.rulesOnline) : text.backendOffline}
            </span>
            <button
              className="icon-button"
              type="button"
              onClick={onToggleLanguage}
              aria-label={text.switchLanguage}
            >
              <Languages size={18} />
              <span>{isArabic ? "EN" : "AR"}</span>
            </button>
            <div className="notifications-wrap" ref={notificationsRef}>
              <button
                aria-expanded={notificationsOpen}
                aria-label={text.notifications}
                className="icon-button notification-button"
                onClick={toggleNotifications}
                type="button"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <section className="notifications-popover" aria-label={text.notifications}>
                  <div className="notifications-heading">
                    <strong>{text.notifications}</strong>
                    <span>{text.notificationsHint}</span>
                  </div>
                  {notifications.map((item) => (
                    <Link key={item.id} to={item.to} onClick={() => setNotificationsOpen(false)}>
                      <span className={`notification-tone ${item.tone}`} />
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                    </Link>
                  ))}
                  {notifications.length === 0 && <p className="notifications-empty">{text.noNotifications}</p>}
                </section>
              )}
            </div>
            <div className="profile-chip">
              <div>
                <strong>{user?.display_name || user?.username}</strong>
                <span>{isArabic ? ({ admin: "إدارة المنصة", analyst: "تحليل حوكمة البيانات", reviewer: "مراجعة الامتثال", viewer: "مشاهدة فقط" }[user?.role] || text.profileRole) : ({ admin: "Platform Administrator", analyst: "Data Governance Analyst", reviewer: "Compliance Reviewer", viewer: "Read-only Viewer" }[user?.role] || text.profileRole)}</span>
              </div>
              <UserRound size={18} />
              <button aria-label={isArabic ? "تسجيل الخروج" : "Sign out"} className="profile-logout" onClick={logout} type="button"><LogOut size={16} /></button>
            </div>
          </div>
        </header>

        <section className="enterprise-content">
          {user?.role === "viewer" && (
            <div className="read-only-banner" role="status">
              <ShieldCheck size={17} />
              <span>{isArabic ? "وضع مشاهدة فقط: يمكن استعراض جميع النتائج، بينما عمليات التعديل والرفع غير متاحة." : "Read-only mode: all results are available to explore, while upload and editing actions are disabled."}</span>
            </div>
          )}
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export default AppLayout;
