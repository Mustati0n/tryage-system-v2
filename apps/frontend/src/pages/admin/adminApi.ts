import axios from "axios";
import { api } from "../../api/client";

export type TriageRecord = {
  kayitId: number;
  hastaId: number;
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  guven: number;
  transcript: string;
  modelVersiyonu: string;
  durum: string;
  overrideEtiket?: string | null;
  overrideNedeni?: string | null;
  basvuruZamani: string;
};

export type DatasetItem = {
  veriId: number;
  kayitId: number;
};

export type UserItem = {
  kullaniciId: number;
  kullaniciAdi: string;
  adSoyad?: string | null;
  rol: "ADMIN" | "PERSONEL";
  aktifMi: boolean;
};

export type SystemStats = {
  toplamKayit: number;
  etiketDagilimi: Record<string, number>;
};

export type SystemModelInfo = {
  modelVersiyonu: string;
  sttMotoru: string;
  not: string;
};

export type SystemLogItem = {
  logId: number;
  actionType: "AUTH_LOGIN" | "AUTH_LOGOUT" | "TRIAGE_CREATE" | "TRIAGE_OVERRIDE" | string;
  actorUsername: string;
  actorRole: "ADMIN" | "PERSONEL" | string;
  description: string;
  createdAt: string;
};

export type ExportResponse = {
  format: string;
  content: string;
  itemCount: number;
};

export type RecordFilters = {
  etiket?: "" | "KIRMIZI" | "SARI" | "YESIL";
  confidenceMin?: string;
  confidenceMax?: string;
  overrideVarMi?: "" | "EVET" | "HAYIR";
  tarihBaslangic?: string;
  tarihBitis?: string;
};

export async function fetchRecords(filters?: RecordFilters) {
  const params = filters
    ? {
        etiket: filters.etiket || undefined,
        confidenceMin: filters.confidenceMin ? Number(filters.confidenceMin) / 100 : undefined,
        confidenceMax: filters.confidenceMax ? Number(filters.confidenceMax) / 100 : undefined,
        overrideVarMi:
          filters.overrideVarMi === ""
            ? undefined
            : filters.overrideVarMi === "EVET",
        tarihBaslangic: filters.tarihBaslangic || undefined,
        tarihBitis: filters.tarihBitis || undefined,
      }
    : undefined;

  const { data } = await api.get<TriageRecord[]>("/api/triage/records", { params });
  return data;
}

export async function fetchDatasetItems() {
  const { data } = await api.get<DatasetItem[]>("/api/dataset/items");
  return data;
}

export async function addDatasetItem(payload: {
  kayitId: number;
  gercekEtiket: "KIRMIZI" | "SARI" | "YESIL";
  not: string;
}) {
  const { data } = await api.post<{ veriId: number }>("/api/dataset/items", {
    kayitId: payload.kayitId,
    gercekEtiket: payload.gercekEtiket,
    not: payload.not || null,
  });
  return data;
}

export async function exportDataset(format: "csv" | "json") {
  const { data } = await api.get<ExportResponse>("/api/dataset/export", {
    params: { format },
  });
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get<UserItem[]>("/api/users");
  return data;
}

export async function createUser(payload: {
  kullaniciAdi: string;
  sifre: string;
  rol: "ADMIN" | "PERSONEL";
}) {
  const { data } = await api.post<UserItem>("/api/users", payload);
  return data;
}

export async function changeUserStatus(kullaniciId: number, aktifMi: boolean) {
  const { data } = await api.patch<UserItem>(`/api/users/${kullaniciId}/status`, {
    aktifMi,
  });
  return data;
}

export async function fetchSystemStats() {
  const { data } = await api.get<SystemStats>("/api/system/stats");
  return data;
}

export async function fetchSystemModelInfo() {
  const { data } = await api.get<SystemModelInfo>("/api/system/models");
  return data;
}

export async function fetchSystemLogs(filters?: {
  q?: string;
  actionType?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const params = filters
    ? {
        q: filters.q || undefined,
        actionType: filters.actionType || undefined,
        role: filters.role || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        limit: filters.limit || undefined,
      }
    : undefined;
  const { data } = await api.get<SystemLogItem[]>("/api/system/logs", { params });
  return data;
}

export async function runSimulationPredict(payload: {
  yas: number;
  cinsiyet: "ERKEK" | "KADIN" | "DIGER";
  sikayetMetni: string;
}) {
  const { data } = await api.post<{
    etiket: string;
    guven: number;
    modelVersiyonu: string;
  }>("/api/triage/predict", payload);
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

export function downloadContent(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function triageBadgeClass(etiket?: string | null) {
  if (etiket === "KIRMIZI") return "triage-badge triage-badge-red";
  if (etiket === "SARI") return "triage-badge triage-badge-yellow";
  if (etiket === "YESIL") return "triage-badge triage-badge-green";
  return "triage-badge triage-badge-neutral";
}
