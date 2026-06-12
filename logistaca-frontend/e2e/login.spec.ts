import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("valid credentials redirect to dashboard", async ({ page }) => {
    await page.getByLabel("Usuario").fill(USERNAME);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials reload login page (no error shown)", async ({ page }) => {
    // NOTE: client.ts interceptor calls window.location.href = '/login' on ANY 401,
    // including the login endpoint itself. The full-page reload clears React state
    // before the error can render. The user sees a fresh login form, not an error msg.
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/auth/token/") && resp.request().method() === "POST",
      { timeout: 8_000 }
    );

    await page.locator("#username").fill("no_such_user");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Ingresar" }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(401);

    // After the reload, user is back on /login with a fresh form.
    await page.waitForURL("**/login**", { timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Logistaca" })).toBeVisible();
  });
});
