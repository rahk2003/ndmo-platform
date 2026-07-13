import {
  Activity,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  LayoutDashboard,
  Lightbulb,
  ShieldCheck,
  History,
  UsersRound,
} from "lucide-react";

export const navigationSections = [
  {
    label: "MAIN",
    labelAr: "الرئيسية",
    items: [
      { to: "/dashboard", label: "Dashboard", labelAr: "لوحة القيادة", icon: LayoutDashboard },
    ],
  },
  {
    label: "GOVERNANCE",
    labelAr: "الحوكمة",
    items: [
      { to: "/assessment", label: "NDMO Assessment", labelAr: "تقييم NDMO", icon: ClipboardCheck },
      { to: "/evidence", label: "Evidence Analysis", labelAr: "تحليل الأدلة", icon: FileSearch },
      { to: "/compliance", label: "Compliance", labelAr: "الامتثال", icon: ShieldCheck },
      { to: "/recommendations", label: "Recommendations", labelAr: "التوصيات", icon: Lightbulb },
    ],
  },
  {
    label: "DATA MANAGEMENT",
    labelAr: "إدارة البيانات",
    items: [
      { to: "/data-assets", label: "Data Assets", labelAr: "أصول البيانات", icon: Database },
      { to: "/data-quality", label: "Data Quality", labelAr: "جودة البيانات", icon: Activity },
      { to: "/policies", label: "Policies", labelAr: "السياسات", icon: FileText },
    ],
  },
  {
    label: "SYSTEM",
    labelAr: "النظام",
    items: [
      { to: "/audit-log", label: "Audit Log", labelAr: "سجل التدقيق", icon: History, roles: ["admin", "reviewer"] },
      { to: "/users", label: "Users", labelAr: "الحسابات", icon: UsersRound, roles: ["admin"] },
    ],
  },
];
