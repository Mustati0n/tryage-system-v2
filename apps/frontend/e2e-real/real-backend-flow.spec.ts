import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  rol: "ADMIN" | "PERSONEL";
  kullaniciId: number;
};

type PatientResponse = {
  hastaId: number;
};

type PredictResponse = {
  etiket: "KIRMIZI" | "SARI" | "YESIL";
  guven: number;
  modelVersiyonu: string;
};

type RecordResponse = {
  kayitId: number;
};

const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";

async function loginByUi(page: Page, username: string, password: string, expectedUrlPart: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanici adi").fill(username);
  await page.getByPlaceholder("Sifre").fill(password);
  await page.getByRole("button", { name: "Giris" }).click();
  await expect(page).toHaveURL(new RegExp(`/${expectedUrlPart}$`));
}

async function apiLogin(request: APIRequestContext, username: string, password: string) {
  const response = await request.post(`${API_BASE}/api/auth/login`, {
    data: { kullaniciAdi: username, sifre: password },
  });
  expect(response.ok()).toBeTruthy();
  const data = (await response.json()) as LoginResponse;
  return data.accessToken;
}

function uniqueTc() {
  const now = Date.now().toString();
  return now.slice(0, 11);
}

async function createRecordViaApi(request: APIRequestContext) {
  const personelToken = await apiLogin(request, "personel", "personel123");
  const tc = uniqueTc();

  const patientRes = await request.post(`${API_BASE}/api/patients`, {
    headers: { Authorization: `Bearer ${personelToken}` },
    data: {
      ad: "E2E",
      soyad: "Hasta",
      tcKimlikNo: tc,
      dogumTarihi: "1999-01-01",
      cinsiyet: "ERKEK",
    },
  });
  expect(patientRes.ok()).toBeTruthy();
  const patient = (await patientRes.json()) as PatientResponse;

  const predictRes = await request.post(`${API_BASE}/api/triage/predict`, {
    headers: { Authorization: `Bearer ${personelToken}` },
    data: {
      yas: 27,
      cinsiyet: "ERKEK",
      sikayetMetni: "2 gundur ates ve kusma var",
    },
  });
  expect(predictRes.ok()).toBeTruthy();
  const predict = (await predictRes.json()) as PredictResponse;

  const recordRes = await request.post(`${API_BASE}/api/triage/records`, {
    headers: { Authorization: `Bearer ${personelToken}` },
    data: {
      hastaId: patient.hastaId,
      yas: 27,
      cinsiyet: "ERKEK",
      sikayetMetni: "2 gundur ates ve kusma var",
      etiket: predict.etiket,
      guven: predict.guven,
      modelVersiyonu: predict.modelVersiyonu,
    },
  });
  expect(recordRes.ok()).toBeTruthy();
  const record = (await recordRes.json()) as RecordResponse;
  return record.kayitId;
}

test.describe("real backend akislari", () => {
  test("yanlis sifre ile login hata mesaji gosterir", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.getByPlaceholder("Kullanici adi").fill("personel");
    await page.getByPlaceholder("Sifre").fill("yanlis-sifre");
    await page.getByRole("button", { name: "Giris" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Giris basarisiz. Bilgileri kontrol et.")).toBeVisible();
  });

  test("personel login -> hasta olustur -> tahmin -> kaydet", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await loginByUi(page, "personel", "personel123", "personel");
    await expect(page.getByRole("heading", { name: "Personel Paneli" })).toBeVisible();

    const tc = uniqueTc();
    await page.getByPlaceholder("TC Kimlik No").fill(tc);
    await page.getByRole("button", { name: "Ara" }).click();
    await expect(page.getByText("Hasta bulunamadi", { exact: false })).toBeVisible();

    await page.locator('input[placeholder="Ad"]').fill("E2E");
    await page.locator('input[placeholder="Soyad"]').fill("Kullanici");
    await page.locator('input[type="date"]').first().fill("2000-01-01");
    await page.getByRole("button", { name: "Hasta Olustur" }).click();
    await expect(page.getByText("Hasta olusturuldu.")).toBeVisible();

    await page.getByPlaceholder("Sikayet metni").fill("2 gundur ates ve kusma var");
    await page.getByRole("button", { name: "Tahmin Al" }).click();
    await expect(page.getByText(/Tahmin:\s*(KIRMIZI|SARI|YESIL)/)).toBeVisible();

    await page.getByRole("button", { name: "Tahmini Kaydet" }).click();
    await expect(page.getByText("Kaydedildi")).toBeVisible();
  });

  test("admin login -> dataset'e ekle (gercek backend)", async ({ page, request }) => {
    const recordId = await createRecordViaApi(request);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await loginByUi(page, "admin", "admin123", "admin");
    await expect(page.getByRole("heading", { name: "Admin Paneli" })).toBeVisible();

    await page.getByRole("button", { name: "Yenile" }).click();

    const targetRow = page.locator("tr", { hasText: ` ${recordId} ` }).first();
    await expect(targetRow).toBeVisible();
    await targetRow.locator('input[name="selectedRecord"]').check();

    const addButton = page.getByRole("button", { name: "Dataset'e Ekle" });
    await addButton.click();
    await expect(page.getByText("Dataset'e eklendi. veriId=", { exact: false })).toBeVisible();
    await expect(page.getByText("Secili kayit zaten dataset'te.")).toBeVisible();
    await expect(addButton).toBeDisabled();
  });

  test("admin login -> kullanici ekle -> pasif/aktif yap", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await loginByUi(page, "admin", "admin123", "admin");
    await expect(page.getByRole("heading", { name: "Admin Paneli" })).toBeVisible();

    const username = `e2e_personel_${Date.now().toString().slice(-6)}`;
    const password = "personel123";

    await page.getByPlaceholder("Kullanici adi").fill(username);
    await page.getByPlaceholder("Sifre").fill(password);
    await page.getByRole("button", { name: "Kullanici Ekle" }).click();

    await expect(page.getByText("Kullanici olusturuldu.")).toBeVisible();

    const userRow = page.locator("tr", { hasText: username }).first();
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText("PERSONEL");
    await expect(userRow).toContainText("AKTIF");

    await userRow.getByRole("button", { name: "Pasif Yap" }).click();
    await expect(page.getByText(`${username} kullanicisi pasif yapildi.`)).toBeVisible();
    await expect(userRow).toContainText("PASIF");

    await userRow.getByRole("button", { name: "Aktif Yap" }).click();
    await expect(page.getByText(`${username} kullanicisi aktif yapildi.`)).toBeVisible();
    await expect(userRow).toContainText("AKTIF");
  });
});
