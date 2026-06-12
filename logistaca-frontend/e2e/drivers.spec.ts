import { test, expect } from "./fixtures";
import { request as pwRequest, type Page } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join("playwright", ".auth", "user.json");
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

// ── Run-scoped unique prefix ──────────────────────────────────────────────────
const RUN_ID = `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2, 5)}`.toUpperCase();

/** Unique last name for each test label — used for table search. */
const dLast = (label: string) => `[${RUN_ID}] ${label}`;
/** Unique license number for each test label — required to be unique in DB. */
const dLicense = (label: string) => `LIC-${RUN_ID}-${label}`;

// ── Shared pre-seeded transport ───────────────────────────────────────────────
// Seeded once in beforeAll so the form's transport select always has an option.
let sharedTransportId: number;
let sharedTransportName: string;
let sharedTransportPlate: string;

async function apiToken(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access } = (await res.json()) as { access: string };
  await ctx.dispose();
  return access;
}

/**
 * POST to create a resource, then GET the list to retrieve the id.
 * Write serializers omit 'id', so a follow-up list query is required.
 */
async function seedViaApi(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<number> {
  const token = await apiToken();
  const ctx = await pwRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  const r = await ctx.post(`${API_URL}/${endpoint}/`, { data: payload });
  if (!r.ok()) {
    const errBody = await r.json();
    await ctx.dispose();
    throw new Error(
      `seedViaApi ${endpoint} POST failed (${r.status()}): ${JSON.stringify(errBody)}`
    );
  }
  const name = String(payload.name);
  const listR = await ctx.get(`${API_URL}/${endpoint}/`, {
    params: { search: name, page_size: 5 },
  });
  const listBody = (await listR.json()) as {
    results: { id: number; name: string }[];
  };
  await ctx.dispose();
  const item = listBody.results.find((it) => it.name === name);
  if (!item) {
    throw new Error(
      `seedViaApi ${endpoint}: item '${name}' not found after creation`
    );
  }
  return item.id;
}

async function removeViaApi(endpoint: string, id: number): Promise<void> {
  const token = await apiToken();
  const ctx = await pwRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  await ctx.delete(`${API_URL}/${endpoint}/${id}/`);
  await ctx.dispose();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Full driver payload for API seeding. Uses backend field name 'transport'
 * (not 'transport_id') so the FK is correctly set.
 */
const driverSeed = (label: string): Record<string, unknown> => ({
  first_name: "E2E",
  last_name: dLast(label),
  transport: sharedTransportId ?? null,
  license_number: dLicense(label),
  phone: "3001234567",
  is_available: true,
  is_active: true,
});

async function searchFor(page: Page, text: string) {
  await page
    .getByPlaceholder("Buscar por nombre, número de licencia...")
    .fill(text);
  await page.waitForTimeout(500);
}

const rowsWith = (page: Page, text: string) =>
  page.locator("tbody tr").filter({ hasText: text });

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe("Drivers CRUD", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeAll(async () => {
    sharedTransportName = `[E2E-${RUN_ID}] Transport`;
    sharedTransportPlate = `E2E-${RUN_ID}`;

    sharedTransportId = await seedViaApi("transport", {
      name: sharedTransportName,
      license_plate: sharedTransportPlate,
      vehicle_type: "VAN",
      is_available: true,
      is_active: true,
    });
  });

  test.afterAll(async () => {
    await removeViaApi("transport", sharedTransportId).catch(() => {});
  });

  // ── 1. Lista ───────────────────────────────────────────────────────────────
  test("lista: tabla renderiza nombre completo y licencia del driver sembrado", async ({
    page,
    api,
  }) => {
    const id = await api.seed("drivers", driverSeed("Lista"));
    try {
      await page.goto("/drivers");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Search by unique last name (backend searches first_name, last_name, license_number).
      await searchFor(page, dLast("Lista"));
      const row = rowsWith(page, dLast("Lista"));
      await expect(row).toHaveCount(1);

      // Full name column = first_name + ' ' + last_name.
      await expect(row.getByText(`E2E ${dLast("Lista")}`)).toBeVisible();
      // License column.
      await expect(row.getByText(dLicense("Lista"))).toBeVisible();
    } finally {
      await api.remove("drivers", id).catch(() => {});
    }
  });

  // ── 2. Crear ───────────────────────────────────────────────────────────────
  test("crear: formulario válido con transport → aparece en lista", async ({
    page,
    api,
  }) => {
    const firstName = "E2E";
    const lastName = dLast("Crear");
    const license = dLicense("Crear");

    await page.goto("/drivers");
    await expect(
      page.getByRole("button", { name: "Nuevo Conductor" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nuevo Conductor" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Nombre").fill(firstName);
    await dialog.getByLabel("Apellido").fill(lastName);
    await dialog.getByLabel("Número de licencia").fill(license);
    await dialog.getByLabel("Teléfono").fill("3009876543");

    // Vehículo select (combobox nth 0) — pick first real transport (skip "Sin vehículo").
    await dialog.locator('[role="combobox"]').nth(0).click();
    const firstTransportOption = page.getByRole("option").nth(1);
    await expect(firstTransportOption).toBeVisible({ timeout: 5_000 });
    await firstTransportOption.click();

    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes("/drivers/") && r.request().method() === "POST",
      { timeout: 8_000 }
    );

    await dialog.getByRole("button", { name: "Crear conductor" }).click();

    const response = await responsePromise;
    const created = (await response.json()) as { id?: number };

    try {
      await expect(dialog).toBeHidden({ timeout: 5_000 });
      await searchFor(page, lastName);
      await expect(rowsWith(page, lastName)).toHaveCount(1, { timeout: 8_000 });
    } finally {
      if (created.id) await api.remove("drivers", created.id).catch(() => {});
    }
  });

  // ── 3. Validación ──────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, no crea nada", async ({
    page,
  }) => {
    await page.goto("/drivers");
    await expect(
      page.getByRole("button", { name: "Nuevo Conductor" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nuevo Conductor" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Crear conductor" }).click();

    await expect(dialog.getByText("Nombre requerido")).toBeVisible();
    await expect(dialog.getByText("Apellido requerido")).toBeVisible();
    await expect(
      dialog.getByText("Número de licencia requerido")
    ).toBeVisible();
    await expect(dialog.getByText("Teléfono requerido")).toBeVisible();

    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/drivers/);
  });

  // ── 4. Editar ──────────────────────────────────────────────────────────────
  test("editar: cambiar teléfono → cambio reflejado en la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("drivers", driverSeed("Editar"));
    try {
      await page.goto("/drivers");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, dLast("Editar"));

      const row = rowsWith(page, dLast("Editar"));
      await expect(row).toHaveCount(1);

      // First button in actions cell = edit (Pencil icon).
      await row.locator("button").first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Editar Conductor")).toBeVisible();

      const phoneInput = dialog.getByLabel("Teléfono");
      await phoneInput.clear();
      await phoneInput.fill("3119999999");

      await dialog.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(dialog).toBeHidden({ timeout: 5_000 });

      await searchFor(page, dLast("Editar"));
      await expect(
        rowsWith(page, dLast("Editar")).filter({ hasText: "3119999999" })
      ).toHaveCount(1, { timeout: 8_000 });
    } finally {
      await api.remove("drivers", id).catch(() => {});
    }
  });

  // ── 5. Eliminar ────────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog → conductor desaparece de la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("drivers", driverSeed("Eliminar"));
    try {
      await page.goto("/drivers");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, dLast("Eliminar"));

      const row = rowsWith(page, dLast("Eliminar"));
      await expect(row).toHaveCount(1);

      // Second button in actions cell = delete (Trash2 icon).
      await row.locator("button").nth(1).click();

      const alertDialog = page.getByRole("alertdialog");
      await expect(alertDialog).toBeVisible();
      // Delete dialog shows the license_number.
      await expect(alertDialog).toContainText(dLicense("Eliminar"));

      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(alertDialog).toBeHidden({ timeout: 5_000 });
      await expect(rowsWith(page, dLast("Eliminar"))).toHaveCount(0, {
        timeout: 8_000,
      });
    } finally {
      await api.remove("drivers", id).catch(() => {});
    }
  });

  // ── 6. Búsqueda ────────────────────────────────────────────────────────────
  test("búsqueda: filtrar por apellido muestra solo coincidencias", async ({
    page,
    api,
  }) => {
    const lastAlfa = dLast("Srch-Alfa");
    const lastBeta = dLast("Srch-Beta");
    const lastGamma = dLast("Srch-Gamma");

    const idA = await api.seed("drivers", {
      ...driverSeed("srch"),
      last_name: lastAlfa,
      license_number: dLicense("srch-a"),
    });
    const idB = await api.seed("drivers", {
      ...driverSeed("srch"),
      last_name: lastBeta,
      license_number: dLicense("srch-b"),
    });
    const idC = await api.seed("drivers", {
      ...driverSeed("srch"),
      last_name: lastGamma,
      license_number: dLicense("srch-c"),
    });

    try {
      await page.goto("/drivers");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Alfa only → 1 row.
      await searchFor(page, lastAlfa);
      await expect(rowsWith(page, lastAlfa)).toHaveCount(1);
      await expect(rowsWith(page, lastBeta)).toHaveCount(0);
      await expect(rowsWith(page, lastGamma)).toHaveCount(0);

      // Shared prefix → all three.
      await searchFor(page, `${RUN_ID}] Srch`);
      await expect(rowsWith(page, lastAlfa)).toHaveCount(1);
      await expect(rowsWith(page, lastBeta)).toHaveCount(1);
      await expect(rowsWith(page, lastGamma)).toHaveCount(1);
    } finally {
      await api.remove("drivers", idA).catch(() => {});
      await api.remove("drivers", idB).catch(() => {});
      await api.remove("drivers", idC).catch(() => {});
    }
  });
});
