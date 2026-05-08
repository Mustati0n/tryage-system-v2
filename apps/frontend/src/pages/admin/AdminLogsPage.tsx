import { useEffect, useMemo, useState } from "react";
import { fetchSystemLogs, type SystemLogItem } from "./adminApi";

export function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemLogs({
        q: search,
        actionType,
        role: roleFilter,
        dateFrom,
        dateTo,
        limit: 400,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triageOpsCount = useMemo(
      () => logs.filter((x) => x.actionType === "TRIAGE_CREATE" || x.actionType === "TRIAGE_OVERRIDE").length,
      [logs],
  );
  const authOpsCount = useMemo(
      () => logs.filter((x) => x.actionType === "AUTH_LOGIN" || x.actionType === "AUTH_LOGOUT").length,
      [logs],
  );

  const actionLabel = (action: string) => {
    switch (action) {
      case "AUTH_LOGIN":
        return "Giris";
      case "AUTH_LOGOUT":
        return "Cikis";
      case "TRIAGE_CREATE":
        return "Triyaj Olusturuldu";
      case "TRIAGE_OVERRIDE":
        return "Triyaj Degistirildi";
      default:
        return action;
    }
  };

  const actionBadgeClass = (action: string) => {
    if (action === "AUTH_LOGIN") return "triage-badge triage-badge-green";
    if (action === "AUTH_LOGOUT") return "triage-badge triage-badge-neutral";
    if (action === "TRIAGE_OVERRIDE") return "triage-badge triage-badge-yellow";
    return "triage-badge triage-badge-neutral";
  };

  return (
    <main className="triage-page admin-pro">
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <p>Toplam Islem</p>
          <strong>{logs.length}</strong>
          <span>son kayitlar</span>
        </article>
        <article className="admin-stat-card">
          <p>Triyaj Islemleri</p>
          <strong>{triageOpsCount}</strong>
          <span>analiz ve karar</span>
        </article>
        <article className="admin-stat-card admin-stat-card-soft">
          <p>Giris / Cikis</p>
          <strong>{authOpsCount}</strong>
          <span>oturum hareketi</span>
        </article>
      </section>

      <section className="admin-panel-card">
        <h2>Sistem Loglari</h2>
        <div className="admin-filter-grid">
          <label>
            Arama
            <input
              placeholder="Kullanici, aciklama veya islem ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Islem Turu
            <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
              <option value="">Tum Islemler</option>
              <option value="AUTH_LOGIN">Giris</option>
              <option value="AUTH_LOGOUT">Cikis</option>
              <option value="TRIAGE_CREATE">Triyaj Olusturuldu</option>
              <option value="TRIAGE_OVERRIDE">Triyaj Degistirildi</option>
            </select>
          </label>
          <label>
            Rol
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Tum Roller</option>
              <option value="ADMIN">ADMIN</option>
              <option value="PERSONEL">PERSONEL</option>
            </select>
          </label>
          <label>
            Baslangic
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            Bitis
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <div className="admin-filter-actions">
            <button onClick={() => void load()} disabled={loading}>
              {loading ? "Yukleniyor..." : "Filtrele"}
            </button>
            <button
              onClick={() => {
                setSearch("");
                setActionType("");
                setRoleFilter("");
                setDateFrom("");
                setDateTo("");
                void fetchSystemLogs({ limit: 400 }).then(setLogs);
              }}>
              Temizle
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kullanici</th>
                <th>Islem</th>
                <th>Aciklama</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Loglar yukleniyor...</td>
                </tr>
              ) : null}
              {logs.map((r) => (
                <tr key={r.logId}>
                  <td>{new Date(r.createdAt).toLocaleString("tr-TR")}</td>
                  <td>
                    {r.actorUsername} · <span className="muted-note">{r.actorRole}</span>
                  </td>
                  <td>
                    <span className={actionBadgeClass(r.actionType)}>{actionLabel(r.actionType)}</span>
                  </td>
                  <td>{r.description}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>Log bulunamadi.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
