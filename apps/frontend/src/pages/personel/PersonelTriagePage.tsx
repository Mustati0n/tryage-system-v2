import { FormEvent, useEffect, useRef, useState } from "react";
import {
  createPatient,
  extractApiError,
  fetchMyRecords,
  predictTriage,
  saveTriageRecord,
  searchPatientByTc,
  transcribeAudio,
  triageBadgeClass,
  type Patient,
  type PredictResponse,
  type TriageRecordResponse,
} from "./personelApi";

const PATIENT_KEY = "personel.selectedPatient";
const TRIAGE_TC_KEY = "personel.triage.tcKimlikNo";
const TRIAGE_FORM_KEY = "personel.triage.form";
const TRIAGE_AUTO_STT_KEY = "personel.triage.autoStt";
const TRIAGE_PENDING_KEY = "personel.triage.pending";

export function PersonelTriagePage() {
  const [tcKimlikNo, setTcKimlikNo] = useState(() => sessionStorage.getItem(TRIAGE_TC_KEY) || "");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    try {
      const raw = sessionStorage.getItem(PATIENT_KEY);
      return raw ? (JSON.parse(raw) as Patient) : null;
    } catch {
      return null;
    }
  });
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [lastAutoSearchedTc, setLastAutoSearchedTc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sttMessage, setSttMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(() => sessionStorage.getItem(TRIAGE_AUTO_STT_KEY) !== "0");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const [triageForm, setTriageForm] = useState({
    yas: "",
    cinsiyet: "KADIN",
    sikayetMetni: "",
  });
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [savedRecord, setSavedRecord] = useState<TriageRecordResponse | null>(null);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [preSaveEtiket, setPreSaveEtiket] = useState<"KIRMIZI" | "SARI" | "YESIL" | null>(null);
  const [preSaveNeden, setPreSaveNeden] = useState("");
  const [createForm, setCreateForm] = useState({
    ad: "",
    soyad: "",
    dogumTarihi: "",
    cinsiyet: "KADIN",
  });

  const canPredict = !!selectedPatient && !predictLoading;
  const canSave = !!predictResult && !!selectedPatient && !saveLoading;
  const hasUnsavedPrediction = !!predictResult && !savedRecord;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TRIAGE_FORM_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { yas?: string; cinsiyet?: string; sikayetMetni?: string };
      setTriageForm((prev) => ({
        yas: parsed.yas ?? prev.yas,
        cinsiyet: parsed.cinsiyet ?? prev.cinsiyet,
        sikayetMetni: parsed.sikayetMetni ?? prev.sikayetMetni,
      }));
    } catch {
      // ignore broken draft
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(TRIAGE_TC_KEY, tcKimlikNo);
  }, [tcKimlikNo]);

  useEffect(() => {
    sessionStorage.setItem(TRIAGE_FORM_KEY, JSON.stringify(triageForm));
  }, [triageForm]);

  useEffect(() => {
    sessionStorage.setItem(TRIAGE_AUTO_STT_KEY, autoTranscribe ? "1" : "0");
  }, [autoTranscribe]);

  useEffect(() => {
    sessionStorage.setItem(TRIAGE_PENDING_KEY, hasUnsavedPrediction ? "1" : "0");
  }, [hasUnsavedPrediction]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedPrediction) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedPrediction]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioPreviewUrl]);


  const searchPatient = async (e: FormEvent) => {
    e.preventDefault();
    await runPatientLookup();
  };

  const runPatientLookup = async () => {
    setPatientError(null);
    setCreateError(null);
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
      const data = await searchPatientByTc(tcKimlikNo);
      if (data.length === 0) {
        setSearchMessage("Hasta bulunamadi. Asagidaki formdan yeni hasta olusturabilirsin.");
      } else {
        setSelectedPatient(data[0]);
        sessionStorage.setItem(PATIENT_KEY, JSON.stringify(data[0]));
        setTriageForm((p) => ({
          ...p,
          yas: data[0].yas != null ? String(data[0].yas) : "",
          cinsiyet: data[0].cinsiyet || "KADIN",
        }));
      }
    } catch (err) {
      setPatientError(extractApiError(err, "Hasta arama sirasinda hata olustu."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
      setLastAutoSearchedTc("");
      return;
    }
    if (tcKimlikNo === lastAutoSearchedTc) return;
    setLastAutoSearchedTc(tcKimlikNo);
    void runPatientLookup();
  }, [tcKimlikNo, lastAutoSearchedTc]);

  const onCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setPatientError(null);
    setSearchMessage(null);

    if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
      setCreateError("Yeni kayit icin gecerli 11 haneli TC zorunlu.");
      return;
    }

    if (!createForm.ad.trim() || !createForm.soyad.trim() || !createForm.dogumTarihi) {
      setCreateError("Ad, soyad ve dogum tarihi zorunlu.");
      return;
    }

    setCreatingPatient(true);
    try {
      const created = await createPatient({
        ad: createForm.ad.trim(),
        soyad: createForm.soyad.trim(),
        tcKimlikNo,
        dogumTarihi: createForm.dogumTarihi,
        cinsiyet: createForm.cinsiyet,
      });

      setSelectedPatient(created);
      sessionStorage.setItem(PATIENT_KEY, JSON.stringify(created));
      setTriageForm((p) => ({
        ...p,
        yas: created.yas != null ? String(created.yas) : p.yas,
        cinsiyet: created.cinsiyet || p.cinsiyet,
      }));
      setSearchMessage("Hasta basariyla olusturuldu ve secildi.");
    } catch (err) {
      setCreateError(extractApiError(err, "Hasta kaydi yapilamadi."));
    } finally {
      setCreatingPatient(false);
    }
  };

  const onPredict = async (e: FormEvent) => {
    e.preventDefault();
    setTriageError(null);
    setSaveMessage(null);
    setShowSaveModal(false);
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
      const data = await predictTriage({
        yas: Number(triageForm.yas),
        cinsiyet: triageForm.cinsiyet,
        sikayetMetni: triageForm.sikayetMetni,
      });
      setPredictResult(data);
      setPreSaveEtiket(data.etiket);
      setPreSaveNeden("");
    } catch (err) {
      setTriageError(extractApiError(err, "Tahmin alma sirasinda hata olustu."));
    } finally {
      setPredictLoading(false);
    }
  };

  const onSave = async () => {
    setTriageError(null);
    setSaveMessage(null);
    setShowSaveModal(false);
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
      const myRecords = await fetchMyRecords();
      const normalize = (value: string) =>
        value
          .toLocaleLowerCase("tr-TR")
          .replace(/\s+/g, " ")
          .trim();
      const normalizedComplaint = normalize(triageForm.sikayetMetni || "");
      const finalEtiketToSave = hasPreSaveOverride ? preSaveEtiket : predictResult.etiket;
      const duplicateRecord = myRecords.find((record) => {
        const finalEtiket = record.overrideEtiket || record.etiket;
        return (
          record.hastaId === selectedPatient.hastaId &&
          normalize(record.transcript || "") === normalizedComplaint &&
          finalEtiket === finalEtiketToSave &&
          Math.abs((record.guven || 0) - (predictResult.guven || 0)) < 0.000001
        );
      });
      if (duplicateRecord) {
        setTriageError(`Bu kaydin aynisi zaten kaydedildi (Kayit #${duplicateRecord.kayitId}).`);
        return;
      }

      const data = await saveTriageRecord({
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
      setSaveMessage(`Kayit basariyla olusturuldu (Kayit #${data.kayitId}).`);
      setShowSaveModal(true);
    } catch (err) {
      setTriageError(extractApiError(err, "Triyaj kaydi kaydedilemedi."));
    } finally {
      setSaveLoading(false);
    }
  };

  const onTranscribeAudio = async (overrideFile?: File) => {
    setTriageError(null);
    setSttMessage(null);

    const fileToUse = overrideFile ?? audioFile;
    if (!fileToUse) {
      setTriageError("Once bir ses dosyasi secmelisin veya kayit baslatmalisin.");
      return;
    }

    setSttLoading(true);
    try {
      const data = await transcribeAudio(fileToUse);
      setTriageForm((p) => ({ ...p, sikayetMetni: data.transcript || "" }));
      setSttMessage("Ses metne cevrildi. Gerekirse metni duzenleyebilirsin.");
    } catch (err) {
      setTriageError(extractApiError(err, "Ses metne cevrilemedi."));
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

        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setIsRecording(false);
        if (autoTranscribe) {
          setSttMessage("Ses kaydi alindi. Otomatik metne cevriliyor...");
          void onTranscribeAudio(file);
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

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setSearchMessage(null);
    setPatientError(null);
    sessionStorage.removeItem(PATIENT_KEY);
  };

  const shouldShowCreatePanel = !selectedPatient && /^[0-9]{11}$/.test(tcKimlikNo);

  return (
    <main className="triage-page admin-pro personel-pro">
      <section className="personel-hero">
        <div>
          <h2>Triyaj Kaydi</h2>
          <p className="muted-note">Hasta secimi, STT ve tahmin kaydi tek akista</p>
        </div>
      </section>

      <section className="personel-kpi-grid">
        <article className="personel-kpi">
          <p>Secili Hasta</p>
          <strong>{selectedPatient ? `${selectedPatient.ad} ${selectedPatient.soyad}` : "-"}</strong>
          <span>{selectedPatient ? `TC: ${selectedPatient.tcKimlikNo}` : "Once hasta sec"}</span>
        </article>
        <article className="personel-kpi">
          <p>Ses Durumu</p>
          <strong>{isRecording ? "Kayit Suruyor" : audioFile ? "Ses Hazir" : "-"}</strong>
          <span>{audioFile ? audioFile.name : "Dosya sec veya mikrofondan kaydet"}</span>
        </article>
        <article className="personel-kpi">
          <p>Tahmin Hazirligi</p>
          <strong>{predictResult ? "Tahmin Hazir" : "Beklemede"}</strong>
          <span>{predictResult ? "Kaydetme adimina gecebilirsin" : "Sikayet metni ve yas gir"}</span>
        </article>
      </section>

      <section className="personel-block">
        <header className="personel-block-head personel-block-head-patient">
          <h3>Hasta Bilgileri</h3>
          <p>TC ile hizli sorgula ve secili hastayi triyaj adimina tası</p>
        </header>
        <div className="personel-block-body personel-patient-body">
          <form onSubmit={searchPatient} className="personel-patient-search">
            <label className="personel-patient-input">
              <span>TC Kimlik No</span>
              <input
                placeholder="11 haneli TC kimlik no"
                value={tcKimlikNo}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setTcKimlikNo(next);
                  setPatientError(null);
                  setSearchMessage(null);
                }}
                maxLength={11}
                required
              />
            </label>
            <div className="personel-patient-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Sorgulaniyor..." : "Hasta Ara"}
              </button>
              {selectedPatient ? (
                <button type="button" className="personel-secondary-action" onClick={clearSelectedPatient}>
                  Secimi Temizle
                </button>
              ) : null}
            </div>
          </form>
          {patientError ? <p className="admin-alert admin-alert-error">{patientError}</p> : null}
          {createError ? <p className="admin-alert admin-alert-error">{createError}</p> : null}
          {searchMessage ? <p className="admin-alert admin-alert-ok">{searchMessage}</p> : null}

          {selectedPatient ? (
            <article className="personel-selected-patient-card">
              <div className="personel-selected-patient-head">
                <strong>
                  {selectedPatient.ad} {selectedPatient.soyad}
                </strong>
                <span className="personel-selected-tag">Secili Hasta</span>
              </div>
              <div className="personel-selected-patient-grid">
                <div>
                  <small>TC Kimlik No</small>
                  <p>{selectedPatient.tcKimlikNo}</p>
                </div>
                <div>
                  <small>Yas</small>
                  <p>{selectedPatient.yas ?? "-"}</p>
                </div>
                <div>
                  <small>Cinsiyet</small>
                  <p>{selectedPatient.cinsiyet}</p>
                </div>
              </div>
            </article>
          ) : null}

          {shouldShowCreatePanel ? (
            <form onSubmit={onCreatePatient} className="admin-filter-grid" style={{ marginTop: 10 }}>
              <label>
                Ad
                <input
                  placeholder="Hasta adi"
                  value={createForm.ad}
                  onChange={(e) => setCreateForm((p) => ({ ...p, ad: e.target.value }))}
                  required
                />
              </label>
              <label>
                Soyad
                <input
                  placeholder="Hasta soyadi"
                  value={createForm.soyad}
                  onChange={(e) => setCreateForm((p) => ({ ...p, soyad: e.target.value }))}
                  required
                />
              </label>
              <label>
                Dogum Tarihi
                <input
                  type="date"
                  value={createForm.dogumTarihi}
                  onChange={(e) => setCreateForm((p) => ({ ...p, dogumTarihi: e.target.value }))}
                  required
                />
              </label>
              <label>
                Cinsiyet
                <select
                  value={createForm.cinsiyet}
                  onChange={(e) => setCreateForm((p) => ({ ...p, cinsiyet: e.target.value }))}>
                  <option value="KADIN">KADIN</option>
                  <option value="ERKEK">ERKEK</option>
                  <option value="DIGER">DIGER</option>
                </select>
              </label>
              <div className="admin-filter-actions">
                <button type="submit" disabled={creatingPatient}>
                  {creatingPatient ? "Kaydediliyor..." : "Hasta Olustur"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>

      <section className="personel-block">
        <header className="personel-block-head personel-block-head-complaint">
          <h3>Sikayet ve Triyaj Bilgileri</h3>
          <p>Metin ve ses girdisini tek panelde yonet, tahmini hizli olustur</p>
        </header>
        <div className="personel-block-body">
          {!selectedPatient ? <p className="muted-note">Triyaj icin once hasta sec.</p> : null}
          <form onSubmit={onPredict} className="personel-complaint-form">
            <div className="personel-complaint-grid">
              <label>
                Yas
                <input
                  type="number"
                  placeholder="Yas"
                  value={triageForm.yas}
                  onChange={(e) => setTriageForm((p) => ({ ...p, yas: e.target.value }))}
                  required
                />
              </label>
              <label>
                Cinsiyet
                <select
                  value={triageForm.cinsiyet}
                  onChange={(e) => setTriageForm((p) => ({ ...p, cinsiyet: e.target.value }))}>
                  <option value="KADIN">KADIN</option>
                  <option value="ERKEK">ERKEK</option>
                  <option value="DIGER">DIGER</option>
                </select>
              </label>
              <label className="personel-full-col">
                Sikayet Metni
                <textarea
                  rows={5}
                  placeholder="Hastanin sikayetini detayli olarak yazin..."
                  value={triageForm.sikayetMetni}
                  onChange={(e) => setTriageForm((p) => ({ ...p, sikayetMetni: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="personel-voice-panel">
              <div className="personel-voice-head">
                <h4>Ses Girisi</h4>
                <p>Ses dosyasi sec veya mikrofondan kayit alarak otomatik STT kullan</p>
              </div>
              <div className={`personel-audio-drop ${isRecording ? "is-recording" : ""} ${audioFile ? "has-audio" : ""}`}>
                <div className="personel-mic-circle">{isRecording ? "●" : "🎙"}</div>
                <strong>{isRecording ? "Kayit Suruyor..." : "Ses Kaydi Hazirla"}</strong>
                <span className="muted-note">
                  {audioFile ? `Secilen Dosya: ${audioFile.name}` : "Dosya secerek veya kaydi baslatarak devam et"}
                </span>
              </div>

              <div className="personel-audio-row">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setAudioFile(selected);
                    setTriageError(null);
                    setSttMessage(null);
                    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                    setAudioPreviewUrl(selected ? URL.createObjectURL(selected) : null);
                  }}
                />
                <button type="button" className="personel-main-action" onClick={startRecording} disabled={isRecording}>
                  {isRecording ? "Kayit Suruyor..." : "Kaydi Baslat"}
                </button>
                <button type="button" className="personel-secondary-action" onClick={stopRecording} disabled={!isRecording}>
                  Kaydi Durdur
                </button>
                <button
                  type="button"
                  className="personel-secondary-action"
                  onClick={() => void onTranscribeAudio()}
                  disabled={sttLoading}>
                  {sttLoading ? "Metne cevriliyor..." : "Metne Cevir (STT)"}
                </button>
              </div>

              <label className="personel-auto-transcribe">
                <input
                  type="checkbox"
                  checked={autoTranscribe}
                  onChange={(e) => setAutoTranscribe(e.target.checked)}
                />
                Kaydi durdurunca otomatik metne cevir
              </label>

              {audioPreviewUrl ? <audio controls src={audioPreviewUrl} className="personel-audio-player" /> : null}
            </div>

            {triageError ? <p className="admin-alert admin-alert-error">{triageError}</p> : null}
            {sttMessage ? <p className="admin-alert admin-alert-ok">{sttMessage}</p> : null}
            {saveMessage ? <p className="admin-alert admin-alert-ok">{saveMessage}</p> : null}

            <div className="admin-filter-actions personel-complaint-actions">
              <button type="submit" className="personel-main-action" disabled={!canPredict}>
                {predictLoading ? "Tahmin aliniyor..." : "Tahmin Al"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {predictResult ? (
        <section className="admin-panel-card">
          <article className="admin-user-card personel-prediction-card">
            <strong>
              Tahmin: <span className={triageBadgeClass(predictResult.etiket)}>{predictResult.etiket}</span>
            </strong>
            <p className="muted-note">Confidence: {(predictResult.guven * 100).toFixed(1)}% · Model: {predictResult.modelVersiyonu}</p>
            <div className="admin-filter-grid">
              <label>
                Kaydetmeden Once Override
                <select value={preSaveEtiket || predictResult.etiket} onChange={(e) => setPreSaveEtiket(e.target.value as "KIRMIZI" | "SARI" | "YESIL")}>
                  <option value="KIRMIZI">KIRMIZI</option>
                  <option value="SARI">SARI</option>
                  <option value="YESIL">YESIL</option>
                </select>
              </label>
              <label>
                Override Nedeni
                <textarea value={preSaveNeden} onChange={(e) => setPreSaveNeden(e.target.value)} placeholder="Etiketi degistirdiysen zorunlu" />
              </label>
            </div>
            <div className="personel-prediction-actions">
              <button type="button" className="personel-main-action" onClick={onSave} disabled={!canSave}>
                {saveLoading ? "Kaydediliyor..." : "Tahmini Kaydet"}
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {savedRecord ? (
        <section className="admin-panel-card">
          <article className="admin-user-card">
            <strong>Kaydedildi · Kayit #{savedRecord.kayitId}</strong>
            <p className="muted-note">
              Orijinal: <span className={triageBadgeClass(savedRecord.etiket)}>{savedRecord.etiket}</span> · Override:{" "}
              <span className={triageBadgeClass(savedRecord.overrideEtiket)}>{savedRecord.overrideEtiket || "-"}</span>
            </p>
          </article>
        </section>
      ) : null}

      {showSaveModal && savedRecord ? (
        <div className="personel-detail-modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="personel-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="personel-detail-top">
              <div>
                <h2>Kayit Basarili</h2>
                <p className="muted-note">Triyaj kaydi sisteme eklendi</p>
              </div>
              <button
                type="button"
                className="personel-modal-close"
                onClick={() => setShowSaveModal(false)}
                aria-label="Kayit modalini kapat">
                ×
              </button>
            </div>
            <article className="admin-user-card">
              <strong>Kayit #{savedRecord.kayitId}</strong>
              <p className="muted-note">
                Orijinal Etiket: <span className={triageBadgeClass(savedRecord.etiket)}>{savedRecord.etiket}</span>
              </p>
              {savedRecord.overrideEtiket ? (
                <p className="muted-note">
                  Final Etiket:{" "}
                  <span className={triageBadgeClass(savedRecord.overrideEtiket)}>{savedRecord.overrideEtiket}</span>
                </p>
              ) : null}
              <div className="admin-filter-actions">
                <button type="button" onClick={() => setShowSaveModal(false)}>
                  Tamam
                </button>
              </div>
            </article>
          </div>
        </div>
      ) : null}

    </main>
  );
}
