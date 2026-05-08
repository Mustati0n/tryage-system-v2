import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  extractApiError,
  fetchPatients,
  searchPatientByTc,
  updatePatient,
  type Patient,
} from "./personelApi";

const PATIENT_KEY = "personel.selectedPatient";
const PATIENT_TC_KEY = "personel.patients.tcKimlikNo";

export function PersonelPatientsPage() {
  const navigate = useNavigate();
  const [tcKimlikNo, setTcKimlikNo] = useState(() => sessionStorage.getItem(PATIENT_TC_KEY) || "");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    try {
      const raw = sessionStorage.getItem(PATIENT_KEY);
      return raw ? (JSON.parse(raw) as Patient) : null;
    } catch {
      return null;
    }
  });
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredPatients, setRegisteredPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [editPatientForm, setEditPatientForm] = useState({
    ad: "",
    soyad: "",
    tcKimlikNo: "",
    dogumTarihi: "",
    cinsiyet: "KADIN" as "KADIN" | "ERKEK" | "DIGER",
  });
  const [updatePatientLoading, setUpdatePatientLoading] = useState(false);
  const [updatePatientMessage, setUpdatePatientMessage] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const showSelectedCard = useMemo(() => {
    if (!selectedPatient) return false;
    if (!tcKimlikNo.trim()) return true;
    return tcKimlikNo.trim() === selectedPatient.tcKimlikNo;
  }, [selectedPatient, tcKimlikNo]);

  const filteredPatients = useMemo(() => {
    const q = listSearch.trim().toLocaleLowerCase("tr-TR");
    if (!q) return registeredPatients;
    return registeredPatients.filter((p) => {
      const haystack = `${p.ad} ${p.soyad} ${p.tcKimlikNo} ${p.cinsiyet}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(q);
    });
  }, [registeredPatients, listSearch]);

  useEffect(() => {
    sessionStorage.setItem(PATIENT_TC_KEY, tcKimlikNo);
  }, [tcKimlikNo]);

  const loadRegisteredPatients = async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const list = await fetchPatients();
      setRegisteredPatients(list);
    } catch (err) {
      setPatientsError(extractApiError(err, "Kayıtlı hastalar alınamadı."));
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    void loadRegisteredPatients();
  }, []);

  const searchPatient = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSearchMessage(null);
    setSelectedPatient(null);

    if (!/^[0-9]{11}$/.test(tcKimlikNo)) {
      setError("TC kimlik no 11 haneli olmali.");
      return;
    }

    setLoading(true);
    try {
      const data = await searchPatientByTc(tcKimlikNo);
      if (data.length === 0) {
        setSearchMessage("Hasta bulunamadi. Lutfen dogru TC ile tekrar ara.");
      } else {
        setSelectedPatient(data[0]);
        sessionStorage.setItem(PATIENT_KEY, JSON.stringify(data[0]));
        void loadRegisteredPatients();
      }
    } catch (err) {
      setError(extractApiError(err, "Hasta arama sirasinda hata olustu."));
    } finally {
      setLoading(false);
    }
  };

  const startEditPatient = (patient: Patient) => {
    setEditingPatientId(patient.hastaId);
    setUpdatePatientMessage(null);
    setEditPatientForm({
      ad: patient.ad,
      soyad: patient.soyad,
      tcKimlikNo: patient.tcKimlikNo,
      dogumTarihi: patient.dogumTarihi,
      cinsiyet: patient.cinsiyet,
    });
  };

  const cancelEditPatient = () => {
    setEditingPatientId(null);
    setUpdatePatientMessage(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelEditPatient();
    };
    if (editingPatientId) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingPatientId]);

  const onUpdatePatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPatientId) return;
    if (!/^[0-9]{11}$/.test(editPatientForm.tcKimlikNo)) {
      setUpdatePatientMessage("TC kimlik no 11 haneli olmalı.");
      return;
    }
    if (!editPatientForm.ad.trim() || !editPatientForm.soyad.trim() || !editPatientForm.dogumTarihi) {
      setUpdatePatientMessage("Ad, soyad ve doğum tarihi zorunlu.");
      return;
    }

    setUpdatePatientLoading(true);
    setUpdatePatientMessage(null);
    try {
      const updated = await updatePatient(editingPatientId, {
        ad: editPatientForm.ad.trim(),
        soyad: editPatientForm.soyad.trim(),
        tcKimlikNo: editPatientForm.tcKimlikNo,
        dogumTarihi: editPatientForm.dogumTarihi,
        cinsiyet: editPatientForm.cinsiyet,
      });
      setUpdatePatientMessage("Hasta bilgileri güncellendi.");
      setRegisteredPatients((prev) => prev.map((p) => (p.hastaId === updated.hastaId ? updated : p)));
      if (selectedPatient?.hastaId === updated.hastaId) {
        setSelectedPatient(updated);
        sessionStorage.setItem(PATIENT_KEY, JSON.stringify(updated));
      }
      setEditingPatientId(null);
    } catch (err) {
      setUpdatePatientMessage(extractApiError(err, "Hasta güncellenemedi."));
    } finally {
      setUpdatePatientLoading(false);
    }
  };

  const transferToTriage = (patient: Patient) => {
    sessionStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
    sessionStorage.setItem("personel.triage.tcKimlikNo", patient.tcKimlikNo);
    navigate("/personel/triage");
  };

  return (
    <main className="triage-page admin-pro">
      <section className="personel-hero">
        <div>
          <h2>Hasta Islemleri</h2>
          <p className="muted-note">Hasta ara, yeni hasta olustur ve triyaja aktar</p>
        </div>
      </section>

      <section className="admin-panel-card">
        <h2>Hasta Bul / Olustur</h2>
        <form onSubmit={searchPatient} className="admin-filter-grid">
          <label>
            TC Kimlik No
              <input
                placeholder="TC Kimlik No"
                value={tcKimlikNo}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setTcKimlikNo(next);
                  setError(null);
                  setSearchMessage(null);
                }}
                maxLength={11}
                required
              />
            </label>
          <div className="admin-filter-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Araniyor..." : "Ara"}
            </button>
          </div>
        </form>

        {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}
        {searchMessage ? <p className="admin-alert admin-alert-ok">{searchMessage}</p> : null}

        {showSelectedCard ? (
          <article className="admin-user-card personel-patient-found-card">
            <strong>
              {selectedPatient?.ad} {selectedPatient?.soyad}
            </strong>
            <p className="muted-note">TC: {selectedPatient?.tcKimlikNo}</p>
            <p className="muted-note">
              Yas: {selectedPatient?.yas ?? "-"} · Cinsiyet: {selectedPatient?.cinsiyet}
            </p>
          </article>
        ) : null}
        {selectedPatient && !showSelectedCard ? (
          <p className="muted-note">Yeni TC yazdin. Tekrar "Ara" ile yeni hasta secimi yapabilirsin.</p>
        ) : null}
      </section>

      <section className="personel-block">
        <header className="personel-block-head personel-block-head-info">
          <h3>Kayıtlı Hastalar</h3>
          <p>Bu listeden hastaları görüntüle ve düzenle</p>
        </header>
        <div className="personel-block-body personel-registered-patients">
          <div className="personel-registered-toolbar">
            <input
              className="personel-registered-search"
              placeholder="Ad, soyad, TC veya cinsiyet ara..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
            />
            <button type="button" className="personel-secondary-action" onClick={() => void loadRegisteredPatients()} disabled={patientsLoading}>
              {patientsLoading ? "Yenileniyor..." : "Listeyi Yenile"}
            </button>
          </div>

          {patientsError ? <p className="admin-alert admin-alert-error">{patientsError}</p> : null}
          {updatePatientMessage ? <p className="admin-alert admin-alert-ok">{updatePatientMessage}</p> : null}

          {patientsLoading ? <p className="muted-note">Kayıtlı hastalar yükleniyor...</p> : null}
          {!patientsLoading && registeredPatients.length === 0 ? <p className="muted-note">Kayıtlı hasta bulunamadı.</p> : null}

          {filteredPatients.map((patient) => (
            <article key={patient.hastaId} className="personel-registered-item">
              <div className="personel-registered-summary">
                <div>
                  <strong>
                    {patient.ad} {patient.soyad}
                  </strong>
                  <p className="muted-note">
                    TC: {patient.tcKimlikNo} · Yaş: {patient.yas ?? "-"} · Cinsiyet: {patient.cinsiyet}
                  </p>
                </div>
                <div className="personel-registered-actions">
                  <button type="button" className="personel-secondary-action" onClick={() => transferToTriage(patient)}>
                    Triyaja Aktar
                  </button>
                  <button type="button" className="personel-secondary-action" onClick={() => startEditPatient(patient)}>
                    Düzenle
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!patientsLoading && filteredPatients.length === 0 && registeredPatients.length > 0 ? (
            <p className="muted-note">Aramanla eşleşen hasta bulunamadı.</p>
          ) : null}
        </div>
      </section>

      {editingPatientId ? (
        <div className="personel-detail-modal-backdrop" onClick={cancelEditPatient}>
          <article className="personel-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="personel-detail-top">
              <h3>Hasta Bilgisi Düzenle</h3>
              <button className="personel-modal-close" type="button" onClick={cancelEditPatient} aria-label="Kapat">
                ×
              </button>
            </div>
            <form onSubmit={onUpdatePatient} className="admin-filter-grid">
              <label>
                Ad
                <input value={editPatientForm.ad} onChange={(e) => setEditPatientForm((p) => ({ ...p, ad: e.target.value }))} required />
              </label>
              <label>
                Soyad
                <input value={editPatientForm.soyad} onChange={(e) => setEditPatientForm((p) => ({ ...p, soyad: e.target.value }))} required />
              </label>
              <label>
                TC Kimlik No
                <input
                  value={editPatientForm.tcKimlikNo}
                  onChange={(e) => setEditPatientForm((p) => ({ ...p, tcKimlikNo: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                  maxLength={11}
                  required
                />
              </label>
              <label>
                Dogum Tarihi
                <input
                  type="date"
                  value={editPatientForm.dogumTarihi}
                  onChange={(e) => setEditPatientForm((p) => ({ ...p, dogumTarihi: e.target.value }))}
                  required
                />
              </label>
              <label>
                Cinsiyet
                <select
                  value={editPatientForm.cinsiyet}
                  onChange={(e) => setEditPatientForm((p) => ({ ...p, cinsiyet: e.target.value as "KADIN" | "ERKEK" | "DIGER" }))}>
                  <option value="KADIN">KADIN</option>
                  <option value="ERKEK">ERKEK</option>
                  <option value="DIGER">DIGER</option>
                </select>
              </label>
              <div className="admin-filter-actions">
                <button type="submit" disabled={updatePatientLoading}>
                  {updatePatientLoading ? "Kaydediliyor..." : "Değişikliği Kaydet"}
                </button>
                <button type="button" className="personel-secondary-action" onClick={cancelEditPatient} disabled={updatePatientLoading}>
                  Vazgeç
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </main>
  );
}
