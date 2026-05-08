import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  extractApiError,
  searchPatientByTc,
  type Patient,
} from "./personelApi";

const PATIENT_KEY = "personel.selectedPatient";
const PATIENT_TC_KEY = "personel.patients.tcKimlikNo";

export function PersonelPatientsPage() {
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
  const showSelectedCard = useMemo(() => {
    if (!selectedPatient) return false;
    if (!tcKimlikNo.trim()) return true;
    return tcKimlikNo.trim() === selectedPatient.tcKimlikNo;
  }, [selectedPatient, tcKimlikNo]);

  useEffect(() => {
    sessionStorage.setItem(PATIENT_TC_KEY, tcKimlikNo);
  }, [tcKimlikNo]);

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
      }
    } catch (err) {
      setError(extractApiError(err, "Hasta arama sirasinda hata olustu."));
    } finally {
      setLoading(false);
    }
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
          <article className="admin-user-card">
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
    </main>
  );
}
