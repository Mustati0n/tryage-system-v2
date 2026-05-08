import { useEffect, useMemo, useState } from "react";
import { fetchMyRecords, triageBadgeClass, type TriageRecordResponse } from "./personelApi";

export function PersonelDashboardPage() {
  const [records, setRecords] = useState<TriageRecordResponse[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMyRecords();
        setRecords(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const lastRecord = records[0] || null;
  const overrideCount = useMemo(() => records.filter((x) => !!x.overrideEtiket).length, [records]);
  const avgConf = useMemo(
    () => (records.length > 0 ? (records.reduce((s, r) => s + (r.guven || 0), 0) / records.length) * 100 : 0),
    [records],
  );

  return (
    <main className="triage-page admin-pro personel-pro">
      <section className="personel-hero">
        <div>
          <h2>Personel Dashboard</h2>
          <p className="muted-note">Gunluk triyaj islemlerine hizli baslangic · {todayLabel}</p>
        </div>
      </section>

      <section className="personel-kpi-grid">
        <article className="personel-kpi personel-kpi-total">
          <div className="personel-kpi-head">
            <p>Toplam Kaydim</p>
            <span className="personel-kpi-icon" aria-hidden="true">
              📄
            </span>
          </div>
          <strong>{records.length}</strong>
          <span>olusturulan kayit</span>
        </article>
        <article className="personel-kpi personel-kpi-override">
          <div className="personel-kpi-head">
            <p>Override Kaydi</p>
            <span className="personel-kpi-icon" aria-hidden="true">
              ✍
            </span>
          </div>
          <strong>{overrideCount}</strong>
          <span>duzenlenmis kayit</span>
        </article>
        <article className="personel-kpi personel-kpi-confidence">
          <div className="personel-kpi-head">
            <p>Ortalama Guven</p>
            <span className="personel-kpi-icon" aria-hidden="true">
              🎯
            </span>
          </div>
          <strong>{avgConf.toFixed(1)}%</strong>
          <span>tum tahminler</span>
        </article>
        <article className="personel-kpi personel-kpi-last">
          <div className="personel-kpi-head">
            <p>Son Etiket</p>
            <span className="personel-kpi-icon" aria-hidden="true">
              🚦
            </span>
          </div>
          <strong>
            {lastRecord ? (
              <span className={triageBadgeClass(lastRecord.overrideEtiket || lastRecord.etiket)}>
                {lastRecord.overrideEtiket || lastRecord.etiket}
              </span>
            ) : (
              "-"
            )}
          </strong>
          <span>en son kayit</span>
        </article>
      </section>

      <section className="admin-panel-card">
        <h2>Son Kayitlar</h2>
        {loading ? <p className="muted-note">Kayitlar yukleniyor...</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {records.slice(0, 5).map((r) => (
            <article key={r.kayitId} className="admin-user-card">
              <strong>Kayit #{r.kayitId}</strong>
              <div>
                Etiket:{" "}
                <span className={triageBadgeClass(r.overrideEtiket || r.etiket)}>
                  {r.overrideEtiket || r.etiket}
                </span>{" "}
                · Confidence: {(r.guven * 100).toFixed(1)}%
              </div>
              <small className="muted-note">
                {r.basvuruZamani ? new Date(r.basvuruZamani).toLocaleString("tr-TR") : "-"}
              </small>
            </article>
          ))}
          {!loading && records.length === 0 ? <p className="muted-note">Henuz kayit yok.</p> : null}
        </div>
      </section>
    </main>
  );
}
