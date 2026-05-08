import axios from "axios";
import { api } from "../../api/client";

export type Patient = {
  hastaId: number;
  ad: string;
  soyad: string;
  tcKimlikNo: string;
  dogumTarihi: string;
  cinsiyet: "KADIN" | "ERKEK" | "DIGER";
  yas?: number | null;
};

export type PredictResponse = {
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  guven: number;
  modelVersiyonu: string;
};

export type TriageRecordResponse = {
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

export type SttResponse = {
  transcript: string;
};

export async function searchPatientByTc(tcKimlikNo: string) {
  const { data } = await api.get<Patient[]>("/api/patients", { params: { tcKimlikNo } });
  return data;
}

export async function createPatient(payload: {
  ad: string;
  soyad: string;
  tcKimlikNo: string;
  dogumTarihi: string;
  cinsiyet: string;
}) {
  const { data } = await api.post<Patient>("/api/patients", payload);
  return data;
}

export async function fetchPatientById(hastaId: number) {
  const { data } = await api.get<Patient>(`/api/patients/${hastaId}`);
  return data;
}

export async function predictTriage(payload: {
  yas: number;
  cinsiyet: string;
  sikayetMetni: string;
}) {
  const { data } = await api.post<PredictResponse>("/api/triage/predict", payload);
  return data;
}

export async function saveTriageRecord(payload: {
  hastaId: number;
  yas: number;
  cinsiyet: string;
  sikayetMetni: string;
  etiket: string;
  guven: number;
  modelVersiyonu: string;
  overrideEtiket: string | null;
  overrideNedeni: string | null;
}) {
  const { data } = await api.post<TriageRecordResponse>("/api/triage/records", payload);
  return data;
}

export async function transcribeAudio(audioFile: File) {
  const formData = new FormData();
  formData.append("audioFile", audioFile);
  const { data } = await api.post<SttResponse>("/api/triage/stt", formData);
  return data;
}

export async function fetchMyRecords() {
  const { data } = await api.get<TriageRecordResponse[]>("/api/triage/records/me");
  return data;
}

export async function updateRecordOverride(
  kayitId: number,
  payload: { overrideEtiket: "KIRMIZI" | "SARI" | "YESIL"; overrideNedeni: string },
) {
  const { data } = await api.patch<TriageRecordResponse>(`/api/triage/records/${kayitId}`, payload);
  return data;
}

export function extractApiError(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message || fallback
    );
  }
  return fallback;
}

export function triageBadgeClass(etiket?: string | null) {
  if (etiket === "KIRMIZI") return "triage-badge triage-badge-red";
  if (etiket === "SARI") return "triage-badge triage-badge-yellow";
  if (etiket === "YESIL") return "triage-badge triage-badge-green";
  return "triage-badge triage-badge-neutral";
}
