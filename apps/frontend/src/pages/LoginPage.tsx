import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const roleHint =
    kullaniciAdi.trim().toLowerCase() === "admin"
      ? "Yonetici paneline giris yapacaksin."
      : "Personel paneline giris yapacaksin.";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.login(kullaniciAdi, sifre);
      const nextRole = localStorage.getItem("role");
      navigate(nextRole === "ADMIN" ? "/admin" : "/personel", { replace: true });
    } catch {
      setError("Giris basarisiz. Bilgileri kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-bg-shape auth-bg-shape-a" />
      <div className="auth-bg-shape auth-bg-shape-b" />
      <div className="auth-bg-grid" />

      <section className="auth-card auth-card-pro">
        <aside className="auth-side">
          <div className="auth-logo">AT</div>
          <h1>Akilli Triyaj</h1>
          <p>Hizli ve guvenilir klinik onceliklendirme paneli</p>
          <div className="auth-side-badges">
            <span>JWT Guvenlik</span>
            <span>Yerel STT</span>
            <span>Model Destekli Triyaj</span>
          </div>
        </aside>

        <div className="auth-form-wrap">
          <h2>Hesabina Giris Yap</h2>
          <p className="auth-sub">Rolune gore panel otomatik acilir.</p>
          <p className="auth-role-hint">{roleHint}</p>

          <form onSubmit={onSubmit} className="auth-form">
            <label>
              Kullanici Adi
              <input
                placeholder="ornek: personel"
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
                required
              />
            </label>
            <label>
              Sifre
              <input
                placeholder="Sifreni gir"
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
              />
            </label>
            <button disabled={loading} type="submit">
              {loading ? "Giris yapiliyor..." : "Panele Giris"}
            </button>
            {error ? <p className="auth-error">{error}</p> : null}
          </form>

          <p className="auth-help">
            Demo: <code>admin/admin123</code> veya <code>personel/personel123</code>
          </p>
        </div>
      </section>
    </main>
  );
}
