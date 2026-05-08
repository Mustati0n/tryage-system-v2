import { useEffect, useMemo, useState } from "react";
import {
  changeUserStatus,
  createUser,
  extractApiError,
  fetchUsers,
  type UserItem,
} from "./adminApi";

export function AdminPersonnelPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "PERSONEL">("PERSONEL");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setMessage(extractApiError(err, "Kullanicilar yuklenemedi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const personnel = useMemo(() => users.filter((u) => u.rol === "PERSONEL"), [users]);
  const activePersonnel = useMemo(() => personnel.filter((u) => u.aktifMi).length, [personnel]);

  const onCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setMessage("Kullanici adi ve sifre zorunludur.");
      return;
    }
    try {
      await createUser({
        kullaniciAdi: newUsername.trim(),
        sifre: newPassword,
        rol: newRole,
      });
      setNewUsername("");
      setNewPassword("");
      setNewRole("PERSONEL");
      setMessage("Kullanici olusturuldu.");
      await loadUsers();
    } catch (err) {
      setMessage(extractApiError(err, "Kullanici olusturma basarisiz."));
    }
  };

  const onToggle = async (u: UserItem, aktifMi: boolean) => {
    try {
      await changeUserStatus(u.kullaniciId, aktifMi);
      setUsers((prev) => prev.map((p) => (p.kullaniciId === u.kullaniciId ? { ...p, aktifMi } : p)));
      setMessage(`${u.kullaniciAdi} ${aktifMi ? "aktif" : "pasif"} yapildi.`);
    } catch (err) {
      setMessage(extractApiError(err, "Kullanici durumu guncellenemedi."));
    }
  };

  return (
    <main className="triage-page admin-pro">
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <p>Toplam Personel</p>
          <strong>{personnel.length}</strong>
          <span>kayitli personel</span>
        </article>
        <article className="admin-stat-card admin-stat-card-soft">
          <p>Aktif Gorevde</p>
          <strong>{activePersonnel}</strong>
          <span>aktif personel</span>
        </article>
        <article className="admin-stat-card">
          <p>Yetkili Roller</p>
          <strong>Personel</strong>
          <span>yonetilebilir</span>
        </article>
      </section>

      <section className="admin-panel-card">
        <h2>Personel Yonetimi</h2>
        <div className="admin-filter-grid">
          <label>
            Kullanici Adi
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="dr_ali" />
          </label>
          <label>
            Sifre
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="******" />
          </label>
          <label>
            Rol
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)}>
              <option value="PERSONEL">PERSONEL</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <div className="admin-filter-actions">
            <button onClick={onCreate}>Personel Ekle</button>
          </div>
        </div>
        {message ? (
          <p className={`admin-alert ${message.includes("basarisiz") || message.includes("zorunlu") ? "admin-alert-error" : "admin-alert-ok"}`}>
            {message}
          </p>
        ) : null}
      </section>

      <section className="admin-user-cards">
        {loading ? <p>Kullanicilar yukleniyor...</p> : null}
        {personnel.map((u) => (
          <article key={u.kullaniciId} className="admin-user-card">
            <div>
              <strong>{u.adSoyad?.trim() || u.kullaniciAdi}</strong>
              <p className="muted-note">@{u.kullaniciAdi}</p>
            </div>
            <span className={u.aktifMi ? "triage-badge triage-badge-green" : "triage-badge triage-badge-neutral"}>
              {u.aktifMi ? "AKTIF" : "PASIF"}
            </span>
            <div>
              {u.aktifMi ? (
                <button onClick={() => void onToggle(u, false)}>Pasif Yap</button>
              ) : (
                <button onClick={() => void onToggle(u, true)}>Aktif Yap</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
