export type Role = "ADMIN" | "PERSONEL";

export type LoginRequest = {
  kullaniciAdi: string;
  sifre: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  rol: Role;
  kullaniciId: number;
};

export type TriageLabel = "KIRMIZI" | "SARI" | "YESIL";

export type PredictResponse = {
  etiket: TriageLabel;
  guven: number; // backend 0..1
  modelVersiyonu: string;
};

export type Patient = {
  hastaId: number;
  ad: string;
  soyad: string;
  tcKimlikNo: string;
  dogumTarihi: string;
  cinsiyet: string;
  yas?: number | null;
};

export type TriageRecordResponse = {
  kayitId: number;
  hastaId: number;
  etiket: TriageLabel;
  guven: number;
  transcript: string;
  modelVersiyonu: string;
};
