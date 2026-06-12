import { test, expect } from "@playwright/test";
import path from "path";

const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const AUTH_FILE = path.join("playwright", ".auth", "user.json");

// ── Unauthenticated tests (no storageState) ──────────────────────────────────
test.describe("Login flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("credenciales válidas → redirige a /dashboard, muestra Sidebar y TopBar", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#username").fill(USERNAME);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Sidebar — <aside aria-label="Navegación principal">
    await expect(
      page.locator('aside[aria-label="Navegación principal"]')
    ).toBeVisible();

    // TopBar — <header> (sticky top bar rendered by DashboardLayout)
    await expect(page.locator("header")).toBeVisible();
  });

  test('credenciales inválidas → muestra "Usuario o contraseña incorrectos.", no redirige', async ({
    page,
  }) => {
    // Mock returns 400 so the 401 response-interceptor (which does window.location.href = '/login')
    // never fires. extractLoginError reads data.error.* and surfaces the first message.
    await page.route(`${API_URL}/auth/token/`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: { non_field_errors: ["Usuario o contraseña incorrectos."] },
          status_code: 400,
        }),
      });
    });

    await page.goto("/login");
    await page.locator("#username").fill("wrong_user");
    await page.locator("#password").fill("wrong_pass");
    await page.getByRole("button", { name: "Ingresar" }).click();

    // Use p[role="alert"] to exclude the Next.js route-announcer <div role="alert">.
    await expect(page.locator('p[role="alert"]')).toContainText(
      "Usuario o contraseña incorrectos."
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test("sin token → /warehouses redirige a /login (middleware AuthGuard)", async ({
    page,
  }) => {
    // /warehouses is a real protected route. The (dashboard) route group does NOT
    // add a URL prefix — pages live at /warehouses, /suppliers, etc.
    // middleware.ts redirects any path not in PUBLIC_PATHS when the
    // logistaca-token cookie is absent.
    await page.goto("/warehouses");
    await page.waitForURL("**/login**", { timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Authenticated tests (storageState from auth.setup.ts) ───────────────────
test.describe("Sesión activa", () => {
  test.use({ storageState: AUTH_FILE });

  test("Cerrar sesión → limpia tokens, vuelve a /login; reintentar /warehouses → /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Wait for the authenticated layout to mount (avoids timing issues with
    // DashboardLayout reading localStorage on the client).
    await expect(
      page.locator('aside[aria-label="Navegación principal"]')
    ).toBeVisible({ timeout: 8_000 });

    // Open user dropdown in TopBar
    await page.getByRole("button", { name: "Menú de usuario" }).click();

    // Click logout
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

    await page.waitForURL("**/login**", { timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);

    // Verify Zustand persist key was cleared
    const savedToken = await page.evaluate(() => {
      const raw = localStorage.getItem("logistaca-auth");
      if (!raw) return null;
      return (
        (JSON.parse(raw) as { state?: { token?: string } })?.state?.token ??
        null
      );
    });
    expect(savedToken).toBeNull();

    // Retry a protected route — middleware should redirect again
    await page.goto("/warehouses");
    await page.waitForURL("**/login**", { timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── (Opcional) Expiración de sesión con refresh ──────────────────────────────
test.describe("Expiración de sesión", () => {
  test.use({ storageState: AUTH_FILE });

  test("access token inválido + refresh válido → reintenta request, no expulsa al usuario", async ({
    page,
  }) => {
    // Each endpoint returns 401 on the first call (simulating expired access token)
    // and 200 on subsequent calls (after the interceptor refreshes the token).
    let warehousesFirstCall = true;
    let meFirstCall = true;

    // Mock refresh endpoint — always returns a new (fake) access token.
    await page.route(`${API_URL}/auth/token/refresh/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access: "refreshed_access_token_e2e" }),
      });
    });

    // Mock /warehouses/: 401 first, paginated 200 after.
    await page.route(`${API_URL}/warehouses/**`, async (route) => {
      if (warehousesFirstCall) {
        warehousesFirstCall = false;
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Token has expired" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 1,
                name: "Bodega E2E",
                city: "Bogotá",
                capacity_m3: 100,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
        });
      }
    });

    // Mock /auth/me/: 401 first, user object after.
    await page.route(`${API_URL}/auth/me/`, async (route) => {
      if (meFirstCall) {
        meFirstCall = false;
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Token has expired" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            username: "testuser",
            email: "test@test.com",
            first_name: "Test",
            last_name: "User",
            is_superuser: false,
            permissions: [],
          }),
        });
      }
    });

    // Override access token to invalid BEFORE React/Zustand initializes from localStorage.
    // The refresh token from AUTH_FILE is preserved, so the interceptor can refresh.
    await page.addInitScript(() => {
      const raw = localStorage.getItem("logistaca-auth");
      if (raw) {
        const state = JSON.parse(raw) as {
          state: { token: string };
        };
        state.state.token = "expired_access_token_for_test";
        localStorage.setItem("logistaca-auth", JSON.stringify(state));
      }
    });

    await page.goto("/warehouses");

    // User stays on /warehouses — not expelled to /login.
    await expect(page).toHaveURL(/\/warehouses/, { timeout: 10_000 });

    // The retry after refresh succeeded — the data table is visible.
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  });
});
