// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Helper: log in via de API en stel session + CSRF cookies in voor de browser.
 */
async function loginViaApi(page, base, email = "admin@example.com", password = "admin123") {
  // Haal csrf_token op via een bootstrap-request zodat de cookie gezet wordt door de server.
  // De login-endpoint zet de csrf_token cookie na succesvolle login.
  const loginResp = await page.request.post(`${base}/api/auth/login`, {
    data: { identifier: email, password },
    headers: { "Content-Type": "application/json" },
  });
  expect(loginResp.status()).toBe(200);
  const body = await loginResp.json();
  expect(body.success).toBe(true);
  return body.user;
}

test.describe("Tab-data: gegevens laden na login", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await loginViaApi(page, baseURL);
  });

  test("GegevensLeveranciers toont leveranciers in tab", async ({ page }) => {
    await page.goto("/gegevens/leveranciers");
    // Wacht op tabel-rijen (ClientTable rendert een <table>)
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    await expect(rows).not.toHaveCount(0);
  });

  test("GegevensMotors toont motortypes in tab", async ({ page }) => {
    await page.goto("/gegevens/motors");
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    await expect(rows).not.toHaveCount(0);
  });

  test("GegevensBanden toont bandtypes in tab", async ({ page }) => {
    await page.goto("/gegevens/banden");
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    await expect(rows).not.toHaveCount(0);
  });

  test("Aanvragen toont rijen", async ({ page }) => {
    await page.goto("/aanvragen");
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    await expect(rows).not.toHaveCount(0);
  });
});

test.describe("Tab-data: verlopen sessie toont login-redirect", () => {
  test("verlopen sessie leidt naar /login, niet naar lege tabel", async ({ page, baseURL }) => {
    // Simuleer verlopen sessie: sla een fake user op in localStorage maar geen geldige cookie
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          id: 999,
          username: "ghost",
          email: "ghost@example.com",
          role: "admin",
          is_super_admin: true,
        })
      );
    });

    // Navigeer naar een data-pagina — app laadt user uit cache maar sessie-cookie ontbreekt
    await page.goto("/gegevens/motors");

    // Na de background /auth/me check moet de app naar /login redirecten
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
