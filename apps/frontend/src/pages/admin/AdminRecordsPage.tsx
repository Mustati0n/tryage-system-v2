import { useEffect, useMemo, useState } from "react";
import {
  addDatasetItem,
  downloadContent,
  exportDataset,
  extractApiError,
  fetchDatasetItems,
  fetchRecords,
  triageBadgeClass,
  type RecordFilters,
  type TriageRecord,
} from "./adminApi";

export function AdminRecordsPage() {
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [datasetRecordIds, setDatasetRecordIds] = useState<number[]>([]);
  const [datasetMessage, setDatasetMessage] = useState<string | null>(null);
  const [datasetMessageKind, setDatasetMessageKind] = useState<"success" | "info" | "error">("success");
  const [gercekEtiket, setGercekEtiket] = useState<"KIRMIZI" | "SARI" | "YESIL">("SARI");
  const [note, setNote] = useState("");

  const [filters, setFilters] = useState<RecordFilters>({
    etiket: "",
    confidenceMin: "",
    confidenceMax: "",
    overrideVarMi: "",
    tarihBaslangic: "",
    tarihBitis: "",
  });

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((x) => x && String(x).trim() !== "").length,
    [filters],
  );

  const load = async (withFilters = false) => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, datasetItems] = await Promise.all([
        fetchRecords(withFilters ? filters : undefined),
        fetchDatasetItems(),
      ]);
      setRecords(recordsData);
      setDatasetRecordIds(datasetItems.map((x) => x.kayitId));
    } catch (err) {
      setError(extractApiError(err, "Kayitlar yuklenemedi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(false);
  }, []);

  const onAddDataset = async () => {
    if (!selectedRecordId) {
      setDatasetMessageKind("error");
      setDatasetMessage("Once bir kayit secmelisin.");
      return;
    }
    if (datasetRecordIds.includes(selectedRecordId)) {
      setDatasetMessageKind("info");
      setDatasetMessage("Bu kayit zaten dataset'te.");
      return;
    }
    try {
      const data = await addDatasetItem({
        kayitId: selectedRecordId,
        gercekEtiket,
        not: note,
      });
      setDatasetRecordIds((prev) => [...prev, selectedRecordId]);
      setDatasetMessageKind("success");
      setDatasetMessage(`Dataset'e eklendi. veriId=${data.veriId}`);
      setNote("");
    } catch (err) {
      setDatasetMessageKind("error");
      setDatasetMessage(extractApiError(err, "Dataset'e ekleme basarisiz."));
    }
  };

  const onExport = async (format: "csv" | "json") => {
    setDatasetMessage(null);
    try {
      const data = await exportDataset(format);
      downloadContent(
        data.content,
        `dataset-export.${format}`,
        format === "csv" ? "text/csv" : "application/json",
      );
    } catch (err) {
      setDatasetMessageKind("error");
      setDatasetMessage(extractApiError(err, "Export islemi basarisiz."));
    }
  };

  return (
    <main className="triage-page admin-pro">
      {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}
      {datasetMessage ? (
        <p
          className={`admin-alert ${
            datasetMessageKind === "success"
              ? "admin-alert-ok"
              : datasetMessageKind === "info"
                ? "admin-alert-warn"
                : "admin-alert-error"
          }`}>
          {datasetMessage}
        </p>
      ) : null}

      <section className="admin-panel-card">
        <div className="admin-title-row">
          <h2>Tum Triyaj Kayitlari</h2>
          <div className="admin-filter-actions">
            <button onClick={() => onExport("csv")}>CSV Indir</button>
            <button onClick={() => onExport("json")}>JSON Indir</button>
          </div>
        </div>

        <p className="muted-note">
          {records.length} kayit listeleniyor {activeFilterCount > 0 ? `· ${activeFilterCount} aktif filtre` : ""}
        </p>

        <div className="admin-filter-grid">
          <label>
            Etiket
            <select
              value={filters.etiket}
              onChange={(e) => setFilters((p) => ({ ...p, etiket: e.target.value as RecordFilters["etiket"] }))}>
              <option value="">Tum Seviyeler</option>
              <option value="KIRMIZI">Acil</option>
              <option value="SARI">Orta</option>
              <option value="YESIL">Dusuk</option>
            </select>
          </label>
          <label>
            Confidence Min
            <input
              type="number"
              min={0}
              max={100}
              value={filters.confidenceMin}
              onChange={(e) => setFilters((p) => ({ ...p, confidenceMin: e.target.value }))}
            />
          </label>
          <label>
            Confidence Max
            <input
              type="number"
              min={0}
              max={100}
              value={filters.confidenceMax}
              onChange={(e) => setFilters((p) => ({ ...p, confidenceMax: e.target.value }))}
            />
          </label>
          <label>
            Override
            <select
              value={filters.overrideVarMi}
              onChange={(e) => setFilters((p) => ({ ...p, overrideVarMi: e.target.value as RecordFilters["overrideVarMi"] }))}>
              <option value="">Tumu</option>
              <option value="EVET">Var</option>
              <option value="HAYIR">Yok</option>
            </select>
          </label>
          <label>
            Tarih Baslangic
            <input
              type="date"
              value={filters.tarihBaslangic}
              onChange={(e) => setFilters((p) => ({ ...p, tarihBaslangic: e.target.value }))}
            />
          </label>
          <label>
            Tarih Bitis
            <input
              type="date"
              value={filters.tarihBitis}
              onChange={(e) => setFilters((p) => ({ ...p, tarihBitis: e.target.value }))}
            />
          </label>
          <div className="admin-filter-actions">
            <button onClick={() => void load(true)} disabled={loading}>
              {loading ? "Yukleniyor..." : "Filtrele"}
            </button>
            <button
              onClick={() => {
                setFilters({
                  etiket: "",
                  confidenceMin: "",
                  confidenceMax: "",
                  overrideVarMi: "",
                  tarihBaslangic: "",
                  tarihBitis: "",
                });
                void load(false);
              }}>
              Temizle
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sec</th>
                <th>Tarih</th>
                <th>Hasta</th>
                <th>ID</th>
                <th>AI Tahmini</th>
                <th>Confidence</th>
                <th>Final Karar</th>
                <th>Override</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Kayitlar yukleniyor...</td>
                </tr>
              ) : null}
              {records.map((r) => (
                <tr key={r.kayitId}>
                  <td>
                    <input
                      type="radio"
                      name="selectedRecord"
                      checked={selectedRecordId === r.kayitId}
                      onChange={() => setSelectedRecordId(r.kayitId)}
                    />
                  </td>
                  <td>{new Date(r.basvuruZamani).toLocaleDateString("tr-TR")}</td>
                  <td>Hasta #{r.hastaId}</td>
                  <td>{r.kayitId}</td>
                  <td><span className={triageBadgeClass(r.etiket)}>{r.etiket}</span></td>
                  <td>{(r.guven * 100).toFixed(1)}%</td>
                  <td>
                    <span className={triageBadgeClass(r.overrideEtiket || r.etiket)}>
                      {r.overrideEtiket || r.etiket}
                    </span>
                  </td>
                  <td>{r.overrideEtiket ? <span className="triage-badge triage-badge-yellow">EVET</span> : "-"}</td>
                  <td>{r.modelVersiyonu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel-card">
        <h2>Datasete Kayit Ekle</h2>
        <div className="admin-filter-grid">
          <label>
            Gercek Etiket
            <select value={gercekEtiket} onChange={(e) => setGercekEtiket(e.target.value as typeof gercekEtiket)}>
              <option value="KIRMIZI">KIRMIZI</option>
              <option value="SARI">SARI</option>
              <option value="YESIL">YESIL</option>
            </select>
          </label>
          <label>
            Not
            <input placeholder="Etiket notu (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="admin-filter-actions">
            <button onClick={onAddDataset} disabled={!selectedRecordId || datasetRecordIds.includes(selectedRecordId)}>
              Dataset'e Ekle
            </button>
          </div>
        </div>
        {!selectedRecordId ? <p className="muted-note">Dataset icin once tablodan kayit sec.</p> : null}
      </section>
    </main>
  );
}
