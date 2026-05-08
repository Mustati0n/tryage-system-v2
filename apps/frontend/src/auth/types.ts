export type Role = "ADMIN" | "PERSONEL";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  rol: Role;
  kullaniciId: number;
};
