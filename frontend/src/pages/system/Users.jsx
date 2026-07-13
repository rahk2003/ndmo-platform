import { useEffect, useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { useLanguage } from "../../language";
import { createUser, getUsers, updateUser } from "../../services/authService";
import { formatGregorianDate } from "../../utils/dateFormat";


const emptyForm = { username: "", display_name: "", password: "", role: "viewer" };

const roleLabel = (role, isArabic) => isArabic ? ({
  admin: "إدارة المنصة",
  analyst: "تحليل حوكمة البيانات",
  reviewer: "مراجعة الامتثال",
  viewer: "مشاهدة فقط",
}[role] || role) : role;


function Users() {
  const { language, isArabic } = useLanguage();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => getUsers().then((data) => { setUsers(data.users || []); setError(""); }).catch((requestError) => setError(requestError?.response?.data?.detail || requestError.message));
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createUser(form);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const changeUser = async (entry, changes) => {
    setSaving(true);
    try {
      await updateUser(entry.id, { role: changes.role ?? entry.role, active: changes.active ?? entry.active });
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="page-stack">
    <PageHeader eyebrow={isArabic ? "الصلاحيات" : "Access Control"} title={isArabic ? "إدارة المستخدمين" : "User Management"} subtitle={isArabic ? "إنشاء الحسابات وتحديد دور كل مستخدم وحالة وصوله." : "Create accounts and control each user's role and access."} />
    {error && <div className="page-error-banner">{error}</div>}
    <section className="enterprise-card user-create-card"><div><UserPlus size={22} /><h2>{isArabic ? "إضافة حساب" : "Add user"}</h2></div><form onSubmit={submit}><label><span>{isArabic ? "الاسم الظاهر" : "Display name"}</span><input onChange={(event) => setForm({ ...form, display_name: event.target.value })} required value={form.display_name} /></label><label><span>{isArabic ? "اسم المستخدم" : "Username"}</span><input onChange={(event) => setForm({ ...form, username: event.target.value })} required value={form.username} /></label><label><span>{isArabic ? "كلمة المرور" : "Password"}</span><input minLength={10} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label><label><span>{isArabic ? "الدور" : "Role"}</span><select onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role}>{["admin", "analyst", "reviewer", "viewer"].map((role) => <option key={role} value={role}>{roleLabel(role, isArabic)}</option>)}</select></label><button className="primary-action" disabled={saving} type="submit">{isArabic ? "إنشاء الحساب" : "Create account"}</button></form></section>
    {users.length === 0 ? <EmptyState icon={UsersRound} title={isArabic ? "لا توجد حسابات" : "No accounts"} description={isArabic ? "يمكن إنشاء أول حساب إضافي من النموذج أعلاه." : "Create an additional account using the form above."} /> : <section className="enterprise-card"><div className="table-shell"><table className="enterprise-table"><thead><tr>{(isArabic ? ["المستخدم", "اسم المستخدم", "الدور", "الحالة", "تاريخ الإنشاء", "الإجراء"] : ["User", "Username", "Role", "Status", "Created", "Action"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{users.map((entry) => <tr key={entry.id}><td><strong>{entry.display_name}</strong></td><td>{entry.username}</td><td><select disabled={saving} onChange={(event) => changeUser(entry, { role: event.target.value })} value={entry.role}>{["admin", "analyst", "reviewer", "viewer"].map((role) => <option key={role} value={role}>{roleLabel(role, isArabic)}</option>)}</select></td><td><StatusBadge status={entry.active ? "Active" : "Expired"} /></td><td>{formatGregorianDate(entry.created_at, language)}</td><td><button className="table-button" disabled={saving} onClick={() => changeUser(entry, { active: !entry.active })} type="button">{entry.active ? (isArabic ? "تعطيل" : "Deactivate") : (isArabic ? "تفعيل" : "Activate")}</button></td></tr>)}</tbody></table></div></section>}
  </div>;
}

export default Users;
