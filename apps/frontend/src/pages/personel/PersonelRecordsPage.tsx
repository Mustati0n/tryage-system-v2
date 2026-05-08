import { useEffect, useMemo, useState } from "react";
import {
  extractApiError,
  fetchPatientById,
  fetchMyRecords,
  triageBadgeClass,
  updateRecordOverride,
  type Patient,
  type TriageRecordResponse,
} from "./personelApi";

type OverrideForm = {
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  neden: string;
};

export function PersonelRecordsPage() {
  const [records, setRecords] = useState<TriageRecordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"ok" | "error">("ok");
  const [search, setSearch] = useState("");
  const [etiketFilter, setEtiketFilter] = useState<"TUMU" | "KIRMIZI" | "SARI" | "YESIL">("TUMU");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>({
    etiket: "SARI",
    neden: "",
  });
  const [saving, setSaving] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await fetchMyRecords();
      setRecords(data);
    } catch (err) {
      setMessageKind("error");
      setMessage(extractApiError(err, "Kayitlar yuklenemedi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  function severityText(etiket?: "KIRMIZI" | "SARI" | "YESIL" | null) {
    if (etiket === "KIRMIZI") return "Acil";
    if (etiket === "SARI") return "Orta";
    if (etiket === "YESIL") return "Dusuk";
    return "-";
  }

  const normalizeText = (value?: string | null) =>
    (value || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");

  const filteredRecords = useMemo(() => {
    const q = normalizeText(search.trim());
    return records.filter((r) => {
      const finalEtiket = r.overrideEtiket || r.etiket;
      if (etiketFilter !== "TUMU" && finalEtiket !== etiketFilter) return false;
      if (!q) return true;
      return (
        normalizeText(String(r.kayitId)).includes(q) ||
        normalizeText(r.transcript || "").includes(q) ||
        normalizeText(r.etiket || "").includes(q) ||
        normalizeText(r.overrideEtiket || "").includes(q) ||
        normalizeText(finalEtiket || "").includes(q) ||
        normalizeText(severityText(r.etiket)).includes(q) ||
        normalizeText(severityText(finalEtiket)).includes(q)
      );
    });
  }, [records, search, etiketFilter]);

  const overrideCount = useMemo(() => records.filter((r) => !!r.overrideEtiket).length, [records]);
  const avgConf = useMemo(
    () => (records.length > 0 ? (records.reduce((sum, r) => sum + (r.guven || 0), 0) / records.length) * 100 : 0),
    [records],
  );
  const selectedRecord = useMemo(
    () => records.find((r) => r.kayitId === selectedRecordId) || null,
    [records, selectedRecordId],
  );
  const currentUsername = localStorage.getItem("username") || "Personel";

  const startEdit = (r: TriageRecordResponse) => {
    setEditingId(r.kayitId);
    setOverrideForm({
      etiket: (r.overrideEtiket || r.etiket) as "KIRMIZI" | "SARI" | "YESIL",
      neden: r.overrideNedeni || "",
    });
    setMessage(null);
  };

  const saveOverride = async (kayitId: number, originalEtiket: "KIRMIZI" | "SARI" | "YESIL") => {
    if (overrideForm.etiket !== originalEtiket && !overrideForm.neden.trim()) {
      setMessageKind("error");
      setMessage("Etiketi degistirirken neden girmek zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await updateRecordOverride(kayitId, {
        overrideEtiket: overrideForm.etiket,
        overrideNedeni: overrideForm.neden.trim() || "Personel duzenlemesi",
      });
      setMessageKind("ok");
      setMessage("Override kaydedildi.");
      setEditingId(null);
      await load();
    } catch (err) {
      setMessageKind("error");
      setMessage(extractApiError(err, "Override kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (record: TriageRecordResponse) => {
    setSelectedRecordId(record.kayitId);
    setSelectedPatient(null);
    setDetailLoading(true);
    try {
      const patient = await fetchPatientById(record.hastaId);
      setSelectedPatient(patient);
    } catch {
      setSelectedPatient(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetail = () => {
    setSelectedRecordId(null);
    setSelectedPatient(null);
    setDetailLoading(false);
  };

  useEffect(() => {
    if (!selectedRecord) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDetail();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRecord]);

  return (
    <main className="triage-page admin-pro personel-pro">
      <section className="personel-hero">
        <div>
          <h2>Kendi Kayitlarim</h2>
          <p className="muted-note">Tum gecmis kayitlarini gor, filtrele ve override duzenle</p>
        </div>
      </section>

      <section className="personel-kpi-grid">
        <article className="personel-kpi">
          <p>Toplam Kayit</p>
          <strong>{records.length}</strong>
          <span>kendi kayitlarin</span>
        </article>
        <article className="personel-kpi">
          <p>Override Kayit</p>
          <strong>{overrideCount}</strong>
          <span>duzenlenen kayitlar</span>
        </article>
        <article className="personel-kpi">
          <p>Ortalama Guven</p>
          <strong>{avgConf.toFixed(1)}%</strong>
          <span>tum tahminler</span>
        </article>
      </section>

      <section className="admin-panel-card">
        <div className="admin-title-row">
          <h2>Kendi Kayitlarim</h2>
          <div className="admin-filter-actions">
            <button onClick={() => void load()} disabled={loading}>
              {loading ? "Yukleniyor..." : "Yenile"}
            </button>
          </div>
        </div>
        <div className="admin-filter-grid">
          <label>
            Arama
            <input
              placeholder="Kayit no, etiket (sari/kirmizi/yesil) veya transcript ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="personel-filter-chip-row">
          <span className="personel-chip-title">Hizli Etiketler</span>
          {(["TUMU", "KIRMIZI", "SARI", "YESIL"] as const).map((etiket) => (
            <button
              key={etiket}
              type="button"
              className={`personel-filter-chip ${etiketFilter === etiket ? "active" : ""}`}
              onClick={() => setEtiketFilter(etiket)}>
              {etiket === "TUMU" ? "Tum Etiketler" : etiket}
            </button>
          ))}
        </div>
        {message ? (
          <p className={`admin-alert ${messageKind === "ok" ? "admin-alert-ok" : "admin-alert-error"}`}>
            {message}
          </p>
        ) : null}
      </section>

      <section className="admin-user-cards">
        {loading ? <p className="muted-note">Kayitlar yukleniyor...</p> : null}
        {!loading && filteredRecords.length === 0 ? <p className="muted-note">Kayit bulunamadi.</p> : null}

        {filteredRecords.map((r) => (
          <article key={r.kayitId} className="personel-record-row">
            <div style={{ width: "100%" }}>
              <strong>Kayit #{r.kayitId}</strong>
              <p className="muted-note">{r.basvuruZamani ? new Date(r.basvuruZamani).toLocaleString("tr-TR") : "-"}</p>
              <div className="personel-record-meta">
                {r.overrideEtiket ? (
                  <>
                    <span>
                      Orijinal: <span className={triageBadgeClass(r.etiket)}>{r.etiket}</span>
                    </span>
                    <span>
                      Final: <span className={triageBadgeClass(r.overrideEtiket)}>{r.overrideEtiket}</span>
                    </span>
                  </>
                ) : (
                  <span>
                    Final: <span className={triageBadgeClass(r.etiket)}>{r.etiket}</span>
                  </span>
                )}
              </div>
              <p className="muted-note">Ses Transkripti: {r.transcript || "-"}</p>
              {r.overrideNedeni ? <p className="muted-note">Override Nedeni: {r.overrideNedeni}</p> : null}
            </div>

            {editingId === r.kayitId ? (
              <div style={{ width: "100%", marginTop: 8 }}>
                <div className="admin-filter-grid">
                  <label>
                    Yeni Etiket
                    <select
                      value={overrideForm.etiket}
                      onChange={(e) =>
                        setOverrideForm((p) => ({
                          ...p,
                          etiket: e.target.value as "KIRMIZI" | "SARI" | "YESIL",
                        }))
                      }>
                      <option value="KIRMIZI">KIRMIZI</option>
                      <option value="SARI">SARI</option>
                      <option value="YESIL">YESIL</option>
                    </select>
                  </label>
                  <label>
                    Neden
                    <textarea
                      value={overrideForm.neden}
                      onChange={(e) => setOverrideForm((p) => ({ ...p, neden: e.target.value }))}
                      placeholder="Etiketi degistirdiysen neden gir..."
                    />
                  </label>
                </div>
                <div className="admin-filter-actions">
                  <button onClick={() => void saveOverride(r.kayitId, r.etiket)} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Override Kaydet"}
                  </button>
                  <button onClick={() => setEditingId(null)} disabled={saving}>
                    Iptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-filter-actions" style={{ marginTop: 8 }}>
                <button className="personel-secondary-action" onClick={() => void openDetail(r)}>
                  Detayı Gör
                </button>
                <button onClick={() => startEdit(r)}>Override Duzenle</button>
              </div>
            )}
          </article>
        ))}
      </section>

      {selectedRecord ? (
        <div className="personel-detail-modal-backdrop" onClick={closeDetail}>
          <div className="personel-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="personel-detail-top">
              <div>
                <h2>Kayıt Detayı</h2>
                <p className="muted-note">ID: tr-{selectedRecord.kayitId}</p>
              </div>
              <button
                type="button"
                className="personel-modal-close"
                onClick={closeDetail}
                aria-label="Detay panelini kapat">
                ×
              </button>
            </div>

            <article
              className={`personel-decision-banner ${
                (selectedRecord.overrideEtiket || selectedRecord.etiket) === "KIRMIZI"
                  ? "danger"
                  : (selectedRecord.overrideEtiket || selectedRecord.etiket) === "SARI"
                    ? "warn"
                    : "ok"
              }`}>
              <div>
                <small>Final Triyaj Kararı</small>
                <strong>{severityText(selectedRecord.overrideEtiket || selectedRecord.etiket)}</strong>
              </div>
              <span>
                {selectedRecord.basvuruZamani
                  ? new Date(selectedRecord.basvuruZamani).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </article>

            <article className="personel-detail-card">
              <h3>Hasta Bilgileri</h3>
              {detailLoading ? <p className="muted-note">Hasta bilgileri yükleniyor...</p> : null}
              <div className="personel-detail-grid">
                <div>
                  <small>Ad Soyad</small>
                  <strong>
                    {selectedPatient ? `${selectedPatient.ad} ${selectedPatient.soyad}` : `Hasta #${selectedRecord.hastaId}`}
                  </strong>
                </div>
                <div>
                  <small>Yaş</small>
                  <strong>{selectedPatient?.yas ?? "-"}</strong>
                </div>
                <div>
                  <small>Cinsiyet</small>
                  <strong>{selectedPatient?.cinsiyet || "-"}</strong>
                </div>
                <div>
                  <small>Başvuru Zamanı</small>
                  <strong>
                    {selectedRecord.basvuruZamani
                      ? new Date(selectedRecord.basvuruZamani).toLocaleString("tr-TR")
                      : "-"}
                  </strong>
                </div>
              </div>
            </article>

            <article className="personel-detail-card">
              <h3>Şikayet Bilgileri</h3>
              <div className="personel-detail-grid">
                <div style={{ gridColumn: "1 / -1" }}>
                  <small>Şikayet Metni</small>
                  <p className="personel-note-box">{selectedRecord.transcript || "-"}</p>
                </div>
              </div>
            </article>

            <article className="personel-detail-card personel-ai-card">
              <h3>Yapay Zeka Tahmini</h3>
              <div className="personel-detail-grid">
                <div>
                  <small>Tahmin Edilen Seviye</small>
                  <strong>{severityText(selectedRecord.etiket)}</strong>
                </div>
                <div>
                  <small>Final Karar</small>
                  <strong>{severityText(selectedRecord.overrideEtiket || selectedRecord.etiket)}</strong>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <small>Güven Skoru</small>
                  <div className="personel-score-row">
                    <div className="personel-score-bar">
                      <span style={{ width: `${Math.max(0, Math.min(100, selectedRecord.guven * 100))}%` }} />
                    </div>
                    <strong>{(selectedRecord.guven * 100).toFixed(1)}%</strong>
                  </div>
                </div>
                <div>
                  <small>Model Versiyonu</small>
                  <strong>{selectedRecord.modelVersiyonu}</strong>
                </div>
                <div>
                  <small>Tahmin Zamanı</small>
                  <strong>
                    {selectedRecord.basvuruZamani
                      ? new Date(selectedRecord.basvuruZamani).toLocaleString("tr-TR")
                      : "-"}
                  </strong>
                </div>
              </div>
            </article>

            <article className="personel-detail-card">
              <h3>Final Karar</h3>
              <div className="personel-detail-grid">
                <div>
                  <small>Karar Verilen Seviye</small>
                  <strong>{severityText(selectedRecord.overrideEtiket || selectedRecord.etiket)}</strong>
                </div>
                <div>
                  <small>Karar Veren Personel</small>
                  <strong>{currentUsername}</strong>
                </div>
                <div>
                  <small>Karar Zamanı</small>
                  <strong>
                    {selectedRecord.basvuruZamani
                      ? new Date(selectedRecord.basvuruZamani).toLocaleString("tr-TR")
                      : "-"}
                  </strong>
                </div>
                <div>
                  <small>Override Durumu</small>
                  <strong>{selectedRecord.overrideEtiket ? "Degistirildi" : "Model Karari"}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      ) : null}
    </main>
  );
}
