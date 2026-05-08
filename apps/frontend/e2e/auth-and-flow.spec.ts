import { expect, test } from "@playwright/test";

test("personel login olduktan sonra personel paneline gider", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "fake-access",
        refreshToken: "fake-refresh",
        rol: "PERSONEL",
        kullaniciId: 2,
      }),
    });
  });

  await page.route("**/api/triage/records/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Kullanici adi").fill("personel");
  await page.getByPlaceholder("Sifre").fill("personel123");
  await page.getByRole("button", { name: "Giris" }).click();

  await expect(page).toHaveURL(/\/personel$/);
  await expect(page.getByRole("heading", { name: "Personel Paneli" })).toBeVisible();
  await expect(page.getByText("Henuz kayit yok.")).toBeVisible();
});

test("yanlis login denemesinde hata mesaji gorunur", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "AUTH_ERROR",
        message: "Kullanici adi veya sifre hatali",
        details: [],
      }),
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Kullanici adi").fill("personel");
  await page.getByPlaceholder("Sifre").fill("wrong-pass");
  await page.getByRole("button", { name: "Giris" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Giris basarisiz. Bilgileri kontrol et.")).toBeVisible();
});

test("admin dataset akisinda secili kayit eklenir ve ikinci kez engellenir", async ({ page }) => {
  let datasetItems = [] as Array<{ veriId: number; kayitId: number }>;

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "fake-admin-access",
        refreshToken: "fake-admin-refresh",
        rol: "ADMIN",
        kullaniciId: 1,
      }),
    });
  });

  await page.route("**/api/triage/records**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          kayitId: 101,
          hastaId: 55,
          etiket: "SARI",
          guven: 0.76,
          transcript: "ates ve karin agrisi",
          modelVersiyonu: "triage-model-v0",
          durum: "TAHMIN_EDILDI",
          overrideEtiket: null,
          overrideNedeni: null,
          basvuruZamani: "2026-03-26T09:30:00Z",
        },
      ]),
    });
  });

  await page.route("**/api/dataset/items", async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(datasetItems),
      });
      return;
    }

    datasetItems = [...datasetItems, { veriId: 1, kayitId: 101 }];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ veriId: 1 }),
    });
  });

  await page.route("**/api/dataset/export**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        format: "csv",
        content: "veriId,kayitId\n1,101\n",
        itemCount: 1,
      }),
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Kullanici adi").fill("admin");
  await page.getByPlaceholder("Sifre").fill("admin123");
  await page.getByRole("button", { name: "Giris" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin Paneli" })).toBeVisible();

  await page.locator('input[name="selectedRecord"]').first().check();
  await page.getByRole("button", { name: "Dataset'e Ekle" }).click();
  await expect(page.getByText("Dataset'e eklendi. veriId=1")).toBeVisible();
  await expect(page.getByText("Secili kayit zaten dataset'te.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dataset'e Ekle" })).toBeDisabled();
});

test("admin kayit secmeden dataset'e ekleyemez", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "fake-admin-access",
        refreshToken: "fake-admin-refresh",
        rol: "ADMIN",
        kullaniciId: 1,
      }),
    });
  });

  await page.route("**/api/triage/records**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/dataset/items", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Kullanici adi").fill("admin");
  await page.getByPlaceholder("Sifre").fill("admin123");
  await page.getByRole("button", { name: "Giris" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Dataset'e eklemek icin listeden bir kayit sec.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dataset'e Ekle" })).toBeDisabled();
});
