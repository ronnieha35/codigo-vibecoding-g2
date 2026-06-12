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

const pName = (label: string) => `[E2E-${RUN_ID}] ${label}`;
const pSku = (label: string) => `SKU-${RUN_ID}-${label}`;

// ── Shared pre-seeded resources ───────────────────────────────────────────────
// beforeAll cannot use function-scoped fixtures, so we auth + call API directly.
let sharedSupplierId: number;
let sharedWarehouseId: number;
let sharedSupplierName: string;
let sharedWarehouseName: string;

async function apiToken(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access } = (await res.json()) as { access: string };
  await ctx.dispose();
  return access;
}

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
  // Write serializers omit 'id'; query the list to retrieve it.
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
      `seedViaApi ${endpoint}: item '${name}' not found in list after creation`
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

/** Full product payload for API seeding. References shared supplier + warehouse. */
const productSeed = (label: string): Record<string, unknown> => ({
  supplier: sharedSupplierId,
  warehouse: sharedWarehouseId,
  name: pName(label),
  sku: pSku(label),
  description: "Descripción E2E",
  category: "Test",
  unit_price: 9.99,
  weight_kg: 1.0,
  length_cm: 10.0,
  width_cm: 5.0,
  height_cm: 3.0,
  stock_quantity: 10,
  is_active: true,
});

/** Types into the search bar and waits for the 400 ms debounce + render. */
async function searchFor(page: Page, text: string) {
  await page
    .getByPlaceholder("Buscar por nombre, SKU, proveedor...")
    .fill(text);
  await page.waitForTimeout(500);
}

/** Returns tbody rows whose visible text contains `text`. */
const rowsWith = (page: Page, text: string) =>
  page.locator("tbody tr").filter({ hasText: text });

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe("Products CRUD", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeAll(async () => {
    sharedSupplierName = pName("Supplier");
    sharedWarehouseName = pName("Warehouse");

    sharedSupplierId = await seedViaApi("suppliers", {
      name: sharedSupplierName,
      email: `e2e-${RUN_ID}@test.com`,
      phone: "3001234567",
      address: "Calle Test 1",
      city: "Bogotá",
      country: "Colombia",
      tax_id: `TAX-${RUN_ID}`,
      is_active: true,
    });

    sharedWarehouseId = await seedViaApi("warehouses", {
      name: sharedWarehouseName,
      address: "Av. Bodega 1",
      city: "Medellín",
      country: "Colombia",
      phone: "3009876543",
      capacity_m3: 200,
      is_active: true,
    });

  });

  test.afterAll(async () => {
    await removeViaApi("warehouses", sharedWarehouseId).catch(() => {});
    await removeViaApi("suppliers", sharedSupplierId).catch(() => {});
  });

  // ── 1. Lista ───────────────────────────────────────────────────────────────
  test("lista: tabla renderiza datos sembrados vía API", async ({
    page,
    api,
  }) => {
    const id = await api.seed("products", productSeed("Lista"));
    try {
      await page.goto("/products");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      await searchFor(page, pName("Lista"));
      await expect(rowsWith(page, pName("Lista"))).toHaveCount(1);
      await expect(
        rowsWith(page, pName("Lista")).getByText(pSku("Lista"))
      ).toBeVisible();
    } finally {
      await api.remove("products", id).catch(() => {});
    }
  });

  // ── 2. Crear ───────────────────────────────────────────────────────────────
  test("crear: formulario válido con proveedor y bodega → aparece en lista", async ({
    page,
    api,
  }) => {
    const newName = pName("Crear");
    const newSku = pSku("Crear");

    await page.goto("/products");
    await expect(
      page.getByRole("button", { name: "Nuevo Producto" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nuevo Producto" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Proveedor select (nth 0)
    await dialog.locator('[role="combobox"]').nth(0).click();
    await page.getByRole("option", { name: sharedSupplierName }).click();

    // Bodega select (nth 1) — pick the first real warehouse option (skip "Sin bodega").
    // The form loads only page 1 (20 items); we select whatever appears first.
    await dialog.locator('[role="combobox"]').nth(1).click();
    // nth(0) = "Sin bodega", nth(1) = first warehouse in the list
    const firstWarehouseOption = page.getByRole("option").nth(1);
    await expect(firstWarehouseOption).toBeVisible({ timeout: 5_000 });
    await firstWarehouseOption.click();

    await dialog.getByLabel("Nombre").fill(newName);
    await dialog.getByLabel("SKU").fill(newSku);
    await dialog.getByLabel("Descripción").fill("Producto creado en E2E");
    await dialog.getByLabel("Categoría").fill("Test");
    await dialog.getByLabel("Precio unitario").fill("19.99");
    await dialog.getByLabel("Peso (kg)").fill("2");
    await dialog.getByLabel("Largo (cm)").fill("10");
    await dialog.getByLabel("Ancho (cm)").fill("5");
    await dialog.getByLabel("Alto (cm)").fill("3");

    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes("/products/") && r.request().method() === "POST",
      { timeout: 8_000 }
    );

    await dialog.getByRole("button", { name: "Crear producto" }).click();

    const response = await responsePromise;
    const created = (await response.json()) as { id: number };

    try {
      await expect(dialog).toBeHidden({ timeout: 5_000 });
      await searchFor(page, newName);
      await expect(rowsWith(page, newName)).toHaveCount(1, { timeout: 8_000 });
    } finally {
      await api.remove("products", created.id).catch(() => {});
    }
  });

  // ── 3. Validación ──────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, no crea nada", async ({
    page,
  }) => {
    await page.goto("/products");
    await expect(
      page.getByRole("button", { name: "Nuevo Producto" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: "Nuevo Producto" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Submit with all fields empty.
    await dialog.getByRole("button", { name: "Crear producto" }).click();

    await expect(dialog.getByText("Proveedor requerido")).toBeVisible();
    await expect(dialog.getByText("Nombre requerido")).toBeVisible();
    await expect(dialog.getByText("SKU requerido")).toBeVisible();
    await expect(dialog.getByText("Descripción requerida")).toBeVisible();
    await expect(dialog.getByText("Categoría requerida")).toBeVisible();
    // unit_price=0 triggers first "Debe ser mayor a 0"
    await expect(dialog.getByText("Debe ser mayor a 0").first()).toBeVisible();

    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/products/);
  });

  // ── 4. Editar ──────────────────────────────────────────────────────────────
  test("editar: cambiar nombre → cambio reflejado en la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("products", productSeed("Editar"));
    try {
      await page.goto("/products");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, pName("Editar"));

      const row = rowsWith(page, pName("Editar"));
      await expect(row).toHaveCount(1);

      // First button in actions cell = edit (Pencil icon).
      await row.locator("button").first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Editar Producto")).toBeVisible();

      const nameInput = dialog.getByLabel("Nombre");
      await nameInput.clear();
      const updatedName = pName("Editar-v2");
      await nameInput.fill(updatedName);

      await dialog.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(dialog).toBeHidden({ timeout: 5_000 });

      await searchFor(page, updatedName);
      await expect(rowsWith(page, updatedName)).toHaveCount(1, {
        timeout: 8_000,
      });
    } finally {
      await api.remove("products", id).catch(() => {});
    }
  });

  // ── 5. Eliminar ────────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog → registro desaparece de la lista", async ({
    page,
    api,
  }) => {
    const id = await api.seed("products", productSeed("Eliminar"));
    try {
      await page.goto("/products");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
      await searchFor(page, pName("Eliminar"));

      const row = rowsWith(page, pName("Eliminar"));
      await expect(row).toHaveCount(1);

      // Second button in actions cell = delete (Trash2 icon).
      await row.locator("button").nth(1).click();

      const alertDialog = page.getByRole("alertdialog");
      await expect(alertDialog).toBeVisible();
      await expect(alertDialog).toContainText(pName("Eliminar"));

      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(alertDialog).toBeHidden({ timeout: 5_000 });
      await expect(rowsWith(page, pName("Eliminar"))).toHaveCount(0, {
        timeout: 8_000,
      });
    } finally {
      await api.remove("products", id).catch(() => {});
    }
  });

  // ── 6. Búsqueda ────────────────────────────────────────────────────────────
  test("búsqueda: filtrar por nombre muestra solo coincidencias", async ({
    page,
    api,
  }) => {
    const nameAlfa = pName("Srch-Alfa");
    const nameBeta = pName("Srch-Beta");
    const nameGamma = pName("Srch-Gamma");

    const idA = await api.seed("products", {
      ...productSeed("srch"),
      name: nameAlfa,
      sku: pSku("srch-a"),
    });
    const idB = await api.seed("products", {
      ...productSeed("srch"),
      name: nameBeta,
      sku: pSku("srch-b"),
    });
    const idC = await api.seed("products", {
      ...productSeed("srch"),
      name: nameGamma,
      sku: pSku("srch-c"),
    });

    try {
      await page.goto("/products");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Alfa only → 1 row
      await searchFor(page, nameAlfa);
      await expect(rowsWith(page, nameAlfa)).toHaveCount(1);
      await expect(rowsWith(page, nameBeta)).toHaveCount(0);
      await expect(rowsWith(page, nameGamma)).toHaveCount(0);

      // Shared prefix → all three rows
      await searchFor(page, `E2E-${RUN_ID}] Srch`);
      await expect(rowsWith(page, nameAlfa)).toHaveCount(1);
      await expect(rowsWith(page, nameBeta)).toHaveCount(1);
      await expect(rowsWith(page, nameGamma)).toHaveCount(1);
    } finally {
      await api.remove("products", idA).catch(() => {});
      await api.remove("products", idB).catch(() => {});
      await api.remove("products", idC).catch(() => {});
    }
  });

  // ── 7. SKU único ───────────────────────────────────────────────────────────
  test("SKU único: crear con SKU duplicado muestra error del backend en el formulario", async ({
    page,
    api,
  }) => {
    const dupSku = pSku("Dup");
    const id = await api.seed("products", {
      ...productSeed("Dup-First"),
      sku: dupSku,
    });

    try {
      await page.goto("/products");
      await expect(
        page.getByRole("button", { name: "Nuevo Producto" })
      ).toBeVisible({ timeout: 8_000 });
      await page.getByRole("button", { name: "Nuevo Producto" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Select supplier (required field)
      await dialog.locator('[role="combobox"]').nth(0).click();
      await page.getByRole("option", { name: sharedSupplierName }).click();

      await dialog.getByLabel("Nombre").fill(pName("Dup-Second"));
      await dialog.getByLabel("SKU").fill(dupSku);
      await dialog.getByLabel("Descripción").fill("Duplicado E2E");
      await dialog.getByLabel("Categoría").fill("Test");
      await dialog.getByLabel("Precio unitario").fill("5");
      await dialog.getByLabel("Peso (kg)").fill("1");
      await dialog.getByLabel("Largo (cm)").fill("1");
      await dialog.getByLabel("Ancho (cm)").fill("1");
      await dialog.getByLabel("Alto (cm)").fill("1");

      await dialog.getByRole("button", { name: "Crear producto" }).click();

      // Dialog stays open; backend error surfaces as "SKU: ..."
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog.locator('[role="alert"]')).toContainText("SKU:", {
        timeout: 8_000,
      });
    } finally {
      await api.remove("products", id).catch(() => {});
    }
  });
});
