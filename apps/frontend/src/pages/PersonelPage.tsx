import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import axios from "axios";

type Patient = {
  hastaId: number;
  ad: string;
  soyad: string;
  tcKimlikNo: string;
  dogumTarihi: string;
  cinsiyet: string;
  yas?: number | null;
};

type PredictResponse = {
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  guven: number;
  modelVersiyonu: string;
};

type TriageRecordResponse = {
  kayitId: number;
  hastaId: number;
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  guven: number;
  transcript: string;
  modelVersiyonu: string;
  durum?: string;
  overrideEtiket?: "KIRMIZI" | "SARI" | "YESIL" | null;
  overrideNedeni?: string | null;
  basvuruZamani?: string;
};

type SttResponse = {
  transcript: string;
};

export function PersonelPage() {
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sttMessage, setSttMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const [createForm, setCreateForm] = useState({
    ad: "",
    soyad: "",
    dogumTarihi: "",
    cinsiyet: "KADIN",
  });

  const [triageForm, setTriageForm] = useState({
    yas: "",
    cinsiyet: "KADIN",
    sikayetMetni: "",
  });
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [savedRecord, setSavedRecord] = useState<TriageRecordResponse | null>(null);
  const [preSaveEtiket, setPreSaveEtiket] = useState<"KIRMIZI" | "SARI" | "YESIL" | null>(null);
  const [preSaveNeden, setPreSaveNeden] = useState("");
  const [myRecords, setMyRecords] = useState<TriageRecordResponse[]>([]);
  const [myRecordsLoading, setMyRecordsLoading] = useState(false);
  const [myRecordsError, setMyRecordsError] = useState<string | null>(null);
  const canPredict = !!selectedPatient && !predictLoading;
  const canSave = !!predictResult && !!selectedPatient && !saveLoading;

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioPreviewUrl]);

  const loadMyRecords = async () => {
    setMyRecordsError(null);
    setMyRecordsLoading(true);
    try {
      const { data } = await api.get<TriageRecordResponse[]>("/api/triage/records/me");
      setMyRecords(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setMyRecordsError(message || "Kayitlar yuklenemedi.");
      } else {
        setMyRecordsError("Kayitlar yuklenemedi.");
      }
    } finally {
      setMyRecordsLoading(false);
    }
  };

  useEffect(() => {
    void loadMyRecords();
  }, []);

  const searchPatient = async (e: FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    setSearchMessage(null);
    setSelectedPatient(null);
    setPredictResult(null);
    setPreSaveEtiket(null);
    setPreSaveNeden("");
    setSavedRecord(null);

    if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
      setPatientError("TC kimlik no 11 haneli olmali.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get<Patient[]>("/api/patients", { params: { tcKimlikNo } });
      if (data.length === 0) {
        setSearchMessage("Hasta bulunamadi. Asagidaki form ile olusturabilirsin.");
      } else {
        setSelectedPatient(data[0]);
        setTriageForm((p) => ({
          ...p,
          yas: data[0].yas != null ? String(data[0].yas) : "",
          cinsiyet: data[0].cinsiyet || "KADIN",
        }));
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setPatientError(message || "Hasta arama sirasinda hata olustu.");
      } else {
        setPatientError("Hasta arama sirasinda hata olustu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (e: FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    setSearchMessage(null);
    setLoading(true);
    try {
      const payload = {
        ad: createForm.ad,
        soyad: createForm.soyad,
        tcKimlikNo,
        dogumTarihi: createForm.dogumTarihi,
        cinsiyet: createForm.cinsiyet,
      };
      const { data } = await api.post<Patient>("/api/patients", payload);
      setSelectedPatient(data);
      setSearchMessage("Hasta olusturuldu.");
      setTriageForm((p) => ({
        ...p,
        yas: data.yas != null ? String(data.yas) : "",
        cinsiyet: data.cinsiyet || "KADIN",
      }));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setPatientError(message || "Hasta olusturma sirasinda hata olustu.");
      } else {
        setPatientError("Hasta olusturma sirasinda hata olustu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const predictTriage = async (e: FormEvent) => {
    e.preventDefault();
    setTriageError(null);
    setSavedRecord(null);
    if (!selectedPatient) {
      setTriageError("Once bir hasta secmelisin.");
      return;
    }
    if (!triageForm.yas || !triageForm.sikayetMetni.trim()) {
      setTriageError("Yas ve sikayet metni zorunlu.");
      return;
    }
    setPredictLoading(true);
    try {
      const { data } = await api.post<PredictResponse>("/api/triage/predict", {
        yas: Number(triageForm.yas),
        cinsiyet: triageForm.cinsiyet,
        sikayetMetni: triageForm.sikayetMetni,
      });
      setPredictResult(data);
      setPreSaveEtiket(data.etiket);
      setPreSaveNeden("");
    } catch {
      setTriageError("Tahmin alma sirasinda hata olustu.");
    } finally {
      setPredictLoading(false);
    }
  };

  const saveTriage = async () => {
    setTriageError(null);
    if (!selectedPatient || !predictResult) {
      setTriageError("Kaydetmeden once tahmin almalisin.");
      return;
    }
    const hasPreSaveOverride = preSaveEtiket != null && preSaveEtiket !== predictResult.etiket;
    if (hasPreSaveOverride && !preSaveNeden.trim()) {
      setTriageError("Kaydetmeden once override nedeni girmelisin.");
      return;
    }
    setSaveLoading(true);
    try {
      const { data } = await api.post<TriageRecordResponse>("/api/triage/records", {
        hastaId: selectedPatient.hastaId,
        yas: Number(triageForm.yas),
        cinsiyet: triageForm.cinsiyet,
        sikayetMetni: triageForm.sikayetMetni,
        etiket: predictResult.etiket,
        guven: predictResult.guven,
        modelVersiyonu: predictResult.modelVersiyonu,
        overrideEtiket: hasPreSaveOverride ? preSaveEtiket : null,
        overrideNedeni: hasPreSaveOverride ? preSaveNeden : null,
      });
      setSavedRecord(data);
      setPreSaveNeden("");
      await loadMyRecords();
    } catch {
      setTriageError("Triyaj kaydi kaydedilemedi.");
    } finally {
      setSaveLoading(false);
    }
  };

  const transcribeAudio = async (overrideFile?: File) => {
    setTriageError(null);
    setSttMessage(null);

    const fileToUse = overrideFile ?? audioFile;
    if (!fileToUse) {
      setTriageError("Once bir ses dosyasi secmelisin veya kayit baslatmalisin.");
      return;
    }

    const formData = new FormData();
    formData.append("audioFile", fileToUse);

    setSttLoading(true);
    try {
      const { data } = await api.post<SttResponse>("/api/triage/stt", formData);
      setTriageForm((p) => ({ ...p, sikayetMetni: data.transcript || "" }));
      setSttMessage("Ses metne cevrildi. Gerekirse metni duzenleyebilirsin.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setTriageError(message || "Ses metne cevrilemedi.");
      } else {
        setTriageError("Ses metne cevrilemedi.");
      }
    } finally {
      setSttLoading(false);
    }
  };

  const startRecording = async () => {
    setTriageError(null);
    setSttMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const extension = mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `kayit-${Date.now()}.${extension}`, { type: mimeType });
        setAudioFile(file);

        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
        }
        setAudioPreviewUrl(URL.createObjectURL(blob));

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setIsRecording(false);
        if (autoTranscribe) {
          setSttMessage("Ses kaydi alindi. Otomatik metne cevriliyor...");
          void transcribeAudio(file);
        } else {
          setSttMessage("Ses kaydi alindi. Metne cevir butonuna basabilirsin.");
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setTriageError("Mikrofon izni alinmadi veya kayit baslatilamadi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("tr-TR");
  };

  const triageBadgeClass = (etiket?: string | null) => {
    if (etiket === "KIRMIZI") return "triage-badge triage-badge-red";
    if (etiket === "SARI") return "triage-badge triage-badge-yellow";
    if (etiket === "YESIL") return "triage-badge triage-badge-green";
    return "triage-badge triage-badge-neutral";
  };

  return (
    <main className="triage-page">
      <section id="hasta" style={{ marginTop: 0, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h2>Hasta Bul / Olustur</h2>
        <form onSubmit={searchPatient} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="TC Kimlik No"
            value={tcKimlikNo}
            onChange={(e) => setTcKimlikNo(e.target.value)}
            maxLength={11}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Araniyor..." : "Ara"}
          </button>
        </form>

        {patientError ? <p style={{ color: "crimson" }}>{patientError}</p> : null}
        {searchMessage ? <p style={{ color: "#333" }}>{searchMessage}</p> : null}

        {selectedPatient ? (
          <article style={{ marginTop: 12, padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
            <strong>
              {selectedPatient.ad} {selectedPatient.soyad}
            </strong>
            <p style={{ margin: "4px 0" }}>TC: {selectedPatient.tcKimlikNo}</p>
            <p style={{ margin: "4px 0" }}>
              Yas: {selectedPatient.yas ?? "-"} | Cinsiyet: {selectedPatient.cinsiyet}
            </p>
          </article>
        ) : null}

        {!selectedPatient && tcKimlikNo.length === 11 ? (
          <form
            onSubmit={createPatient}
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 8,
            }}>
            <input
              placeholder="Ad"
              value={createForm.ad}
              onChange={(e) => setCreateForm((p) => ({ ...p, ad: e.target.value }))}
              required
            />
            <input
              placeholder="Soyad"
              value={createForm.soyad}
              onChange={(e) => setCreateForm((p) => ({ ...p, soyad: e.target.value }))}
              required
            />
            <input
              type="date"
              value={createForm.dogumTarihi}
              onChange={(e) => setCreateForm((p) => ({ ...p, dogumTarihi: e.target.value }))}
              required
            />
            <select
              value={createForm.cinsiyet}
              onChange={(e) => setCreateForm((p) => ({ ...p, cinsiyet: e.target.value }))}>
              <option value="KADIN">KADIN</option>
              <option value="ERKEK">ERKEK</option>
              <option value="DIGER">DIGER</option>
            </select>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Hasta Olustur"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section id="triyaj" style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h2>Triyaj Kaydi Olustur</h2>
        {!selectedPatient ? (
          <p style={{ marginTop: 0, color: "#555" }}>
            Triyaj islemlerine baslamak icin once yukaridan hasta sec veya olustur.
          </p>
        ) : null}
        <form
          onSubmit={predictTriage}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 8,
          }}>
          <input
            type="number"
            placeholder="Yas"
            value={triageForm.yas}
            onChange={(e) => setTriageForm((p) => ({ ...p, yas: e.target.value }))}
            required
          />
          <select
            value={triageForm.cinsiyet}
            onChange={(e) => setTriageForm((p) => ({ ...p, cinsiyet: e.target.value }))}>
            <option value="KADIN">KADIN</option>
            <option value="ERKEK">ERKEK</option>
            <option value="DIGER">DIGER</option>
          </select>
          <textarea
            style={{ gridColumn: "1 / -1", minHeight: 96 }}
            placeholder="Sikayet metni"
            value={triageForm.sikayetMetni}
            onChange={(e) => setTriageForm((p) => ({ ...p, sikayetMetni: e.target.value }))}
            required
          />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                setAudioFile(e.target.files?.[0] ?? null);
                setTriageError(null);
                setSttMessage(null);
                if (audioPreviewUrl) {
                  URL.revokeObjectURL(audioPreviewUrl);
                }
                const selected = e.target.files?.[0];
                setAudioPreviewUrl(selected ? URL.createObjectURL(selected) : null);
              }}
            />
            <button type="button" onClick={startRecording} disabled={isRecording}>
              {isRecording ? "Kayit Suruyor..." : "Kaydi Baslat"}
            </button>
            <button type="button" onClick={stopRecording} disabled={!isRecording}>
              Kaydi Durdur
            </button>
            <button type="button" onClick={() => void transcribeAudio()} disabled={sttLoading}>
              {sttLoading ? "Metne cevriliyor..." : "Metne Cevir (STT)"}
            </button>
          </div>
          <label style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={autoTranscribe}
              onChange={(e) => setAutoTranscribe(e.target.checked)}
            />
            Kaydi durdurunca otomatik metne cevir
          </label>
          {audioPreviewUrl ? (
            <audio style={{ gridColumn: "1 / -1" }} controls src={audioPreviewUrl} />
          ) : null}
          {triageError ? <p style={{ gridColumn: "1 / -1", margin: 0, color: "crimson" }}>{triageError}</p> : null}
          {sttMessage ? (
            <p style={{ gridColumn: "1 / -1", margin: 0, color: "#0b5" }}>{sttMessage}</p>
          ) : null}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" disabled={!canPredict}>
              {predictLoading ? "Tahmin aliniyor..." : "Tahmin Al"}
            </button>
            <button type="button" onClick={saveTriage} disabled={!canSave}>
              {saveLoading ? "Kaydediliyor..." : "Tahmini Kaydet"}
            </button>
          </div>
        </form>

        {predictResult ? (
          <article style={{ marginTop: 12, padding: 12, background: "#eef7ff", borderRadius: 8 }}>
            <strong>
              Tahmin: <span className={triageBadgeClass(predictResult.etiket)}>{predictResult.etiket}</span>
            </strong>
            <p style={{ margin: "4px 0" }}>Confidence: {(predictResult.guven * 100).toFixed(1)}%</p>
            <p style={{ margin: "4px 0" }}>Model: {predictResult.modelVersiyonu}</p>
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              <strong>Kaydetmeden Once Override</strong>
              <select
                value={preSaveEtiket || predictResult.etiket}
                onChange={(e) => setPreSaveEtiket(e.target.value as "KIRMIZI" | "SARI" | "YESIL")}>
                <option value="KIRMIZI">KIRMIZI</option>
                <option value="SARI">SARI</option>
                <option value="YESIL">YESIL</option>
              </select>
              <textarea
                placeholder="Override nedeni (etiketi degistirdiysen zorunlu)"
                value={preSaveNeden}
                onChange={(e) => setPreSaveNeden(e.target.value)}
                style={{ minHeight: 70 }}
              />
              <p style={{ margin: 0 }}>
                Orijinal Model Etiketi:{" "}
                <span className={triageBadgeClass(predictResult.etiket)}>{predictResult.etiket}</span> | Kaydedilecek
                Etiket: <span className={triageBadgeClass(preSaveEtiket || predictResult.etiket)}>{preSaveEtiket || predictResult.etiket}</span>
              </p>
            </div>
          </article>
        ) : null}

        {savedRecord ? (
          <article style={{ marginTop: 12, padding: 12, background: "#efffee", borderRadius: 8 }}>
            <strong>Kaydedildi</strong>
            <p style={{ margin: "4px 0" }}>Kayit ID: {savedRecord.kayitId}</p>
            <p style={{ margin: "4px 0" }}>
              Orijinal Etiket:{" "}
              <span className={triageBadgeClass(savedRecord.etiket)}>{savedRecord.etiket}</span> | Override Etiket:{" "}
              <span className={triageBadgeClass(savedRecord.overrideEtiket)}>{savedRecord.overrideEtiket || "-"}</span>
            </p>
          </article>
        ) : null}
      </section>

      <section id="kayitlar" style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Kendi Kayitlarim</h2>
          <button type="button" onClick={() => void loadMyRecords()} disabled={myRecordsLoading}>
            {myRecordsLoading ? "Yenileniyor..." : "Yenile"}
          </button>
        </div>

        {myRecordsError ? <p style={{ color: "crimson" }}>{myRecordsError}</p> : null}
        {myRecordsLoading ? <p>Kayitlar yukleniyor...</p> : null}
        {!myRecordsLoading && myRecords.length === 0 ? <p>Henuz kayit yok.</p> : null}

        <div style={{ display: "grid", gap: 10 }}>
          {myRecords.map((record) => (
            <article key={record.kayitId} style={{ padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong>Kayit #{record.kayitId}</strong>
                <span>{formatDateTime(record.basvuruZamani)}</span>
              </div>
              <p style={{ margin: "6px 0" }}>
                Etiket: <span className={triageBadgeClass(record.overrideEtiket || record.etiket)}>{record.overrideEtiket || record.etiket}</span> | Confidence:{" "}
                {(record.guven * 100).toFixed(1)}% | Override: {record.overrideEtiket ? "Var" : "Yok"}
              </p>
              <p style={{ margin: "6px 0" }}>
                Orijinal: <span className={triageBadgeClass(record.etiket)}>{record.etiket}</span> | Override:{" "}
                <span className={triageBadgeClass(record.overrideEtiket)}>{record.overrideEtiket || "-"}</span>
              </p>
              <p style={{ margin: "6px 0" }}>
                Model: {record.modelVersiyonu} | Durum: {record.durum || "-"}
              </p>
              <p style={{ margin: "6px 0" }}>Transcript: {record.transcript}</p>
              {record.overrideNedeni ? <p style={{ margin: "6px 0" }}>Override Nedeni: {record.overrideNedeni}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
