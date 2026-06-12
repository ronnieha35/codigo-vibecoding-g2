import { test, expect } from "./fixtures";
import { type Page } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join("playwright", ".auth", "user.json");

// ── Run-scoped unique prefix ──────────────────────────────────────────────────
// Evaluated once per worker process. Different workers → different RUN_ID.
// Prevents name collisions with records left over from prior runs or other
// parallel workers.
const RUN_ID = `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2, 5)}`.toUpperCase();

/** Creates a unique warehouse name for this run + label. */
const wName = (label: string) => `[E2E-${RUN_ID}] ${label}`;

const warehouseSeed = (label: string) => ({
  name: wName(label),
  address: `Calle Test ${label} #1-23`,
  city: "Bogotá",
  country: "Colombia",
  phone: "3001234567",
  capacity_m3: 100,
  is_active: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Types into the desktop search bar and waits for the 400 ms debounce + render. */
async function searchFor(page: Page, text: string) {
  const input = page.getByPlaceholder("Buscar por nombre, ciudad, país...");
  await input.fill(text);
  await page.waitForTimeout(500);
}

/** Returns tbody rows whose visible text contains `text`. */
const rowsWith = (page: Page, text: string) =>
  page.locator("tbody tr").filter({ hasText: text });

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe("Warehouses CRUD", () => {
  test.use({ storageState: AUTH_FILE });

  // ── 1. Lista ───────────────────────────────────────────────────────────────
  test("lista: tabla renderiza datos sembrados vía API", async ({
    page,
    api,
  }) => {
    const id = await api.seed("warehouses", warehouseSeed("Lista"));
    try {
      await page.goto("/warehouses");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Search by unique name to guarantee the row is on-screen regardless of pagination.
      await searchFor(page, wName("Lista"));
      await expect(rowsWith(page, wName("Lista"))).toHaveCount(1);
      await expect(
        rowsWith(page, wName("Lista")).getByText("Bogotá")
      ).toBeVisible();
    } finally {
      await api.remove("warehouses", id).catch(() => {});
    }
  });

  // ── 2. Crear ───────────────────────────────────────────────────────────────
  test("crear: formulario válido → registro aparece en la lista", async ({
    page,
    api,
  }) => {
    const newName = wName("Crear");

    await page.goto("/warehouses");
    await expect(
      page.getByRole("button", { name: "Nueva Bodega" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nueva Bodega" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Nombre").fill(newName);
    await dialog.getByLabel("Dirección").fill("Av. Creación 100");
    await dialog.getByLabel("Ciudad").fill("Medellín");
    await dialog.getByLabel("País").fill("Colombia");
    await dialog.getByLabel("Teléfono").fill("3109876543");
    await dialog.getByLabel("Capacidad (m³)").fill("250");

    // Capture the POST response to extract the created ID for cleanup.
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes("/warehouses/") && r.request().method() === "POST",
      { timeout: 8_000 }
    );

    await dialog.getByRole("button", { name: "Crear bodega" }).click();

    const response = await responsePromise;
    const created = (await response.json()) as { id: number };

    try {
      // Dialog closes on success.
      await expect(dialog).toBeHidden({ timeout: 5_000 });

      // New row visible in the table.
      await searchFor(page, newName);
      await expect(rowsWith(page, newName)).toHaveCount(1, { timeout: 8_000 });
    } finally {
      await api.remove("warehouses", created.id).catch(() => {});
    }
  });

  // ── 3. Validación ──────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, no crea nada", async ({
    page,
  }) => {
    await page.goto("/warehouses");
    await expect(
      page.getByRole("button", { name: "Nueva Bodega" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nueva Bodega" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Submit with all fields empty (capacity defaults to 0 — fails positive()).
    await dialog.getByRole("button", { name: "Crear bodega" }).click();

    await expect(dialog.getByText("Nombre requerido")).toBeVisible();
    await expect(dialog.getByText("Dirección requerida")).toBeVisible();
    await expect(dialog.getByText("Ciudad requerida")).toBeVisible();
    await expect(dialog.getByText("Debe ser mayor a 0")).toBeVisible();

    // Dialog stays open — no record was created.
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/warehouses/);
  });

  // ── 4. Editar ──────────────────────────────────────────────────────────────
  test("editar: cambiar ciudad → cambio reflejado en la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("warehouses", warehouseSeed("Editar"));
    try {
      await page.goto("/warehouses");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, wName("Editar"));

      const row = rowsWith(page, wName("Editar"));
      await expect(row).toHaveCount(1);

      // First button in actions cell = edit (Pencil icon).
      await row.locator("button").first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Editar Bodega")).toBeVisible();

      const cityInput = dialog.getByLabel("Ciudad");
      await cityInput.clear();
      await cityInput.fill("Cali");

      await dialog.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(dialog).toBeHidden({ timeout: 5_000 });

      // After invalidateQueries + refetch the row should show the new city.
      await searchFor(page, wName("Editar"));
      await expect(
        rowsWith(page, wName("Editar")).filter({ hasText: "Cali" })
      ).toHaveCount(1, { timeout: 8_000 });
    } finally {
      await api.remove("warehouses", id).catch(() => {});
    }
  });

  // ── 5. Eliminar ────────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog → registro desaparece de la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("warehouses", warehouseSeed("Eliminar"));
    try {
      await page.goto("/warehouses");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, wName("Eliminar"));

      const row = rowsWith(page, wName("Eliminar"));
      await expect(row).toHaveCount(1);

      // Second button in actions cell = delete (Trash2 icon).
      await row.locator("button").nth(1).click();

      const alertDialog = page.getByRole("alertdialog");
      await expect(alertDialog).toBeVisible();
      await expect(alertDialog).toContainText(wName("Eliminar"));

      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(alertDialog).toBeHidden({ timeout: 5_000 });

      // List invalidated + refetched; soft-deleted item no longer appears.
      await expect(rowsWith(page, wName("Eliminar"))).toHaveCount(0, {
        timeout: 8_000,
      });
    } finally {
      await api.remove("warehouses", id).catch(() => {});
    }
  });

  // ── 6. Búsqueda / filtro ───────────────────────────────────────────────────
  test("búsqueda: filtrar por nombre muestra solo coincidencias", async ({
    page,
    api,
  }) => {
    const nameAlfa = wName("Srch-Alfa");
    const nameBeta = wName("Srch-Beta");
    const nameGamma = wName("Srch-Gamma");

    const idA = await api.seed("warehouses", {
      ...warehouseSeed("srch"),
      name: nameAlfa,
    });
    const idB = await api.seed("warehouses", {
      ...warehouseSeed("srch"),
      name: nameBeta,
    });
    const idC = await api.seed("warehouses", {
      ...warehouseSeed("srch"),
      name: nameGamma,
    });

    try {
      await page.goto("/warehouses");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Search for Alfa specifically — only one row should match.
      await searchFor(page, nameAlfa);
      await expect(rowsWith(page, nameAlfa)).toHaveCount(1);
      await expect(rowsWith(page, nameBeta)).toHaveCount(0);
      await expect(rowsWith(page, nameGamma)).toHaveCount(0);

      // Search by the shared RUN_ID prefix — all three appear.
      await searchFor(page, `E2E-${RUN_ID}] Srch`);
      await expect(rowsWith(page, nameAlfa)).toHaveCount(1);
      await expect(rowsWith(page, nameBeta)).toHaveCount(1);
      await expect(rowsWith(page, nameGamma)).toHaveCount(1);
    } finally {
      await api.remove("warehouses", idA).catch(() => {});
      await api.remove("warehouses", idB).catch(() => {});
      await api.remove("warehouses", idC).catch(() => {});
    }
  });
});
