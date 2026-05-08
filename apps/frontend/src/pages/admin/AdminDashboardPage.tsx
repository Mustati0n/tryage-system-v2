import { useEffect, useMemo, useState } from "react";
import {
  fetchRecords,
  fetchUsers,
  fetchSystemStats,
  fetchSystemModelInfo,
  runSimulationPredict,
  extractApiError,
  triageBadgeClass,
  type TriageRecord,
  type UserItem,
  type SystemStats,
  type SystemModelInfo,
} from "./adminApi";

type SimForm = {
  yas: string;
  cinsiyet: "ERKEK" | "KADIN" | "DIGER";
  sikayetMetni: string;
};

export function AdminDashboardPage() {
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [systemModelInfo, setSystemModelInfo] = useState<SystemModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simForm, setSimForm] = useState<SimForm>({
    yas: "35",
    cinsiyet: "KADIN",
    sikayetMetni: "",
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<{
    etiket: string;
    guven: number;
    modelVersiyonu: string;
  } | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, usersData, statsData, modelData] = await Promise.all([
        fetchRecords(),
        fetchUsers(),
        fetchSystemStats(),
        fetchSystemModelInfo(),
      ]);
      setRecords(recordsData);
      setUsers(usersData);
      setSystemStats(statsData);
      setSystemModelInfo(modelData);
    } catch (err) {
      setError(extractApiError(err, "Dashboard verileri yuklenemedi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const todayRecordCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((r) => (r.basvuruZamani || "").slice(0, 10) === today).length;
  }, [records]);

  const activePersonnelCount = useMemo(
    () => users.filter((u) => u.rol === "PERSONEL" && u.aktifMi).length,
    [users],
  );

  const totalPersonnelCount = useMemo(
    () => users.filter((u) => u.rol === "PERSONEL").length,
    [users],
  );

  const triageDist = useMemo(() => {
    const counts = { KIRMIZI: 0, SARI: 0, YESIL: 0 };
    for (const r of records) {
      if (r.etiket in counts) {
        counts[r.etiket as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [records]);

  const totalDist = triageDist.KIRMIZI + triageDist.SARI + triageDist.YESIL;
  const redPct = totalDist > 0 ? Math.round((triageDist.KIRMIZI / totalDist) * 100) : 0;
  const yellowPct = totalDist > 0 ? Math.round((triageDist.SARI / totalDist) * 100) : 0;
  const overrideCount = useMemo(() => records.filter((r) => !!r.overrideEtiket).length, [records]);
  const overridePct = records.length > 0 ? Math.round((overrideCount / records.length) * 100) : 0;

  const weeklyTrend = useMemo(() => {
    const labels = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];
    const rows = labels.map((label) => ({ label, total: 0, override: 0 }));
    for (const r of records) {
      const date = new Date(r.basvuruZamani);
      const jsDay = date.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      rows[idx].total += 1;
      if (r.overrideEtiket) rows[idx].override += 1;
    }
    return rows;
  }, [records]);
  const maxTrendValue = Math.max(1, ...weeklyTrend.map((x) => x.total));

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      }),
    [],
  );

  const runSimulation = async () => {
    setSimError(null);
    setSimResult(null);
    if (!simForm.yas || Number(simForm.yas) < 0 || Number(simForm.yas) > 130) {
      setSimError("Yas 0-130 araliginda olmali.");
      return;
    }
    if (!simForm.sikayetMetni.trim()) {
      setSimError("Sikayet metni zorunludur.");
      return;
    }
    setSimLoading(true);
    try {
      const data = await runSimulationPredict({
        yas: Number(simForm.yas),
        cinsiyet: simForm.cinsiyet,
        sikayetMetni: simForm.sikayetMetni.trim(),
      });
      setSimResult(data);
    } catch (err) {
      setSimError(extractApiError(err, "Simulasyon tahmini alinamadi."));
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <main className="triage-page admin-pro">
      <section className="admin-hero">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted-note">Sistem ozeti · {todayLabel}</p>
        </div>
        <button onClick={() => void refresh()} disabled={loading}>
          {loading ? "Yukleniyor..." : "Yenile"}
        </button>
      </section>

      {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <p>Toplam Kayit</p>
          <strong>{records.length}</strong>
          <span>sistemde</span>
        </article>
        <article className="admin-stat-card">
          <p>Bugunku Kayitlar</p>
          <strong>{todayRecordCount}</strong>
          <span>kayit</span>
        </article>
        <article className="admin-stat-card admin-stat-card-soft">
          <p>Aktif Personel</p>
          <strong>{activePersonnelCount}</strong>
          <span>/ {totalPersonnelCount} toplam</span>
        </article>
        <article className="admin-stat-card">
          <p>Toplam Personel</p>
          <strong>{totalPersonnelCount}</strong>
          <span>kayitli</span>
        </article>
      </section>

      <section className="admin-charts-grid">
        <article className="admin-panel-card">
          <h3>Triyaj Seviyesi Dagilimi</h3>
          <div className="admin-donut-wrap">
            <div
              className="admin-donut"
              style={{
                background: `conic-gradient(#e63c52 0 ${redPct}%, #f3a020 ${redPct}% ${redPct + yellowPct}%, #2cb378 ${redPct + yellowPct}% 100%)`,
              }}
            />
            <div className="admin-donut-legend">
              <span><i className="dot red" /> Kirmizi: {triageDist.KIRMIZI}</span>
              <span><i className="dot yellow" /> Sari: {triageDist.SARI}</span>
              <span><i className="dot green" /> Yesil: {triageDist.YESIL}</span>
            </div>
          </div>
        </article>

        <article className="admin-panel-card">
          <h3>Haftalik Kayit Trendi</h3>
          <div className="admin-bars">
            {weeklyTrend.map((d) => (
              <div key={d.label} className="admin-bar-col">
                <div className="admin-bar-stack">
                  <div className="admin-bar-total" style={{ height: `${(d.total / maxTrendValue) * 96}%` }} />
                  <div className="admin-bar-override" style={{ height: `${(d.override / maxTrendValue) * 96}%` }} />
                </div>
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-charts-grid">
        <article className="admin-panel-card">
          <h3>ML Model Izleme</h3>
          <div className="admin-progress-head">
            <span>Override Orani</span>
            <strong>{overridePct}%</strong>
          </div>
          <div className="admin-progress-track">
            <div className="admin-progress-fill" style={{ width: `${overridePct}%` }} />
          </div>
          <p className="muted-note">{overrideCount} / {records.length || 0} kayit override edildi</p>
          {systemModelInfo ? (
            <div className="admin-model-note">
              Model: {systemModelInfo.modelVersiyonu} · STT: {systemModelInfo.sttMotoru}
              <br />
              {systemModelInfo.not}
            </div>
          ) : null}
          {systemStats ? (
            <p className="muted-note admin-inline-note">
              Toplam Kayit (system): {systemStats.toplamKayit}
            </p>
          ) : null}
        </article>

        <article className="admin-panel-card">
          <h3>Aktif Personel ({activePersonnelCount})</h3>
          <div className="admin-person-list">
            {users
              .filter((u) => u.rol === "PERSONEL")
              .slice(0, 4)
              .map((u) => (
                <div key={`mini-${u.kullaniciId}`} className="admin-person-mini">
                  <span>{u.kullaniciAdi}</span>
                  <em className={u.aktifMi ? "ok" : "passive"}>{u.aktifMi ? "AKTIF" : "PASIF"}</em>
                </div>
              ))}
          </div>
        </article>
      </section>

      <section className="admin-panel-card">
        <h2>Deneme / Simulasyon Triyaj</h2>
        <div className="admin-filter-grid">
          <label>
            Yas
            <input
              type="number"
              min={0}
              max={130}
              value={simForm.yas}
              onChange={(e) => setSimForm((p) => ({ ...p, yas: e.target.value }))}
            />
          </label>
          <label>
            Cinsiyet
            <select
              value={simForm.cinsiyet}
              onChange={(e) => setSimForm((p) => ({ ...p, cinsiyet: e.target.value as SimForm["cinsiyet"] }))}>
              <option value="KADIN">KADIN</option>
              <option value="ERKEK">ERKEK</option>
              <option value="DIGER">DIGER</option>
            </select>
          </label>
          <div className="admin-filter-actions">
            <button onClick={runSimulation} disabled={simLoading}>
              {simLoading ? "Tahmin aliniyor..." : "Simulasyon Tahmini Al"}
            </button>
          </div>
        </div>
        <textarea
          className="admin-textarea"
          placeholder="Simulasyon sikayet metni"
          value={simForm.sikayetMetni}
          onChange={(e) => setSimForm((p) => ({ ...p, sikayetMetni: e.target.value }))}
          rows={4}
        />
        {simError ? <p className="admin-alert admin-alert-error">{simError}</p> : null}
        {simResult ? (
          <div className="admin-model-note">
            Tahmin: <span className={triageBadgeClass(simResult.etiket)}>{simResult.etiket}</span> · Confidence:{" "}
            {(simResult.guven * 100).toFixed(1)}% · Model: {simResult.modelVersiyonu}
          </div>
        ) : null}
      </section>
    </main>
  );
}
