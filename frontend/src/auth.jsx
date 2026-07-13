import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AUTH_TOKEN_KEY, getErrorMessage } from "./services/apiClient";
import {
  bootstrapAccount,
  getAuthStatus,
  getCurrentAccount,
  loginAccount,
  logoutAccount,
} from "./services/authService";
import { AuthContext, useAuth } from "./authContext";


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let active = true;
    getAuthStatus()
      .then(async (status) => {
        if (!active) return;
        if (!status.initialized) {
          setMode("bootstrap");
          setUser(null);
          return;
        }
        if (!window.localStorage.getItem(AUTH_TOKEN_KEY)) {
          setMode("login");
          setUser(null);
          return;
        }
        const data = await getCurrentAccount();
        if (!active) return;
        setUser(data.user);
        setMode("authenticated");
      })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setMode("login");
      });
    const expire = () => {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setMode("login");
    };
    window.addEventListener("ndmo-auth-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("ndmo-auth-expired", expire);
    };
  }, []);

  const value = useMemo(() => ({
    user,
    mode,
    async login(username, password) {
      const data = await loginAccount({ username, password });
      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setUser(data.user);
      setMode("authenticated");
    },
    async bootstrap(username, displayName, password) {
      await bootstrapAccount({ username, display_name: displayName, password });
      const data = await loginAccount({ username, password });
      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setUser(data.user);
      setMode("authenticated");
    },
    async logout() {
      try {
        await logoutAccount();
      } finally {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setMode("login");
      }
    },
  }), [mode, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function AuthGate({ children, language }) {
  const { mode, login, bootstrap } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isArabic = language === "ar";

  const localizedError = (requestError) => {
    const message = getErrorMessage(requestError, isArabic ? "تعذر إكمال تسجيل الدخول." : "Could not sign in.");
    if (!isArabic) return message;
    if (message === "Invalid username or password") return "اسم المستخدم أو كلمة المرور غير صحيحة.";
    if (message === "Platform account already initialized") return "تم إنشاء حساب المنصة مسبقًا. سجّلي الدخول للمتابعة.";
    if (message.startsWith("Password must contain")) return "استخدمي 10 أحرف على الأقل، مع حرف ورقم.";
    return message === "Network Error" ? "تعذر الاتصال بالخادم المحلي." : message;
  };

  if (mode === "authenticated") return children;
  if (mode === "loading") return <div className="auth-loading">{isArabic ? "جار التحقق من الجلسة..." : "Checking session..."}</div>;

  const isBootstrap = mode === "bootstrap";
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isBootstrap) await bootstrap(username, displayName, password);
      else await login(username, password);
    } catch (requestError) {
      setError(localizedError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="auth-card">
        <div className="auth-mark"><ShieldCheck size={30} /></div>
        <p>{isArabic ? "منصة NDMO" : "NDMO Platform"}</p>
        <h1>{isBootstrap ? (isArabic ? "إنشاء حساب الإدارة" : "Create administrator account") : (isArabic ? "تسجيل الدخول" : "Sign in")}</h1>
        <span>{isBootstrap ? (isArabic ? "إنشاء أول حساب آمن لإدارة المنصة." : "Create the first secure account for this platform.") : (isArabic ? "إدخال بيانات الحساب للمتابعة." : "Enter your account details to continue.")}</span>
        <form onSubmit={submit}>
          {isBootstrap && <label><span>{isArabic ? "الاسم الظاهر" : "Display name"}</span><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} required value={displayName} /></label>}
          <label><span>{isArabic ? "اسم المستخدم" : "Username"}</span><input autoComplete="username" onChange={(event) => setUsername(event.target.value)} required value={username} /></label>
          <label><span>{isArabic ? "كلمة المرور" : "Password"}</span><div className="auth-password"><LockKeyhole size={17} /><input autoComplete={isBootstrap ? "new-password" : "current-password"} minLength={10} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div></label>
          {isBootstrap && <small>{isArabic ? "استخدمي 10 أحرف على الأقل، مع حرف ورقم." : "Use at least 10 characters with one letter and one number."}</small>}
          {error && <div className="auth-error">{error}</div>}
          <button disabled={submitting} type="submit">{submitting ? (isArabic ? "جار الحفظ..." : "Saving...") : isBootstrap ? (isArabic ? "إنشاء الحساب" : "Create account") : (isArabic ? "دخول" : "Sign in")}</button>
        </form>
      </section>
    </main>
  );
}
