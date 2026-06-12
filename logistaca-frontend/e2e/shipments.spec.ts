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

/**
 * Unique destination_city per test label — used as the search key to find a
 * shipment in the list (the viewset supports ?search=<city>).
 */
const sCity = (label: string) => `${RUN_ID}-${label}`;
const sName = (label: string) => `[E2E-${RUN_ID}] ${label}`;
const sSku = (label: string) => `SKU-${RUN_ID}-${label}`;

// ── Shared pre-seeded dependencies ────────────────────────────────────────────
let sharedWarehouseId: number;
let sharedSupplierId: number;
let sharedCustomerId: number;
let sharedProductId: number;
let sharedCustomerName: string;
let sharedProductName: string;

// ── API helpers ───────────────────────────────────────────────────────────────

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

/**
 * Seed a shipment via API; finds the created record by unique destination_city
 * since ShipmentWriteSerializer does not include 'id' in its response.
 */
async function seedShipmentViaApi(
  payload: Record<string, unknown>
): Promise<number> {
  const token = await apiToken();
  const ctx = await pwRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  const r = await ctx.post(`${API_URL}/shipments/`, { data: payload });
  if (!r.ok()) {
    const errBody = await r.json();
    await ctx.dispose();
    throw new Error(
      `seedShipmentViaApi POST failed (${r.status()}): ${JSON.stringify(errBody)}`
    );
  }
  const city = String(payload.destination_city);
  const listR = await ctx.get(`${API_URL}/shipments/`, {
    params: { search: city, page_size: 5 },
  });
  const listBody = (await listR.json()) as {
    results: { id: number; destination_city: string }[];
  };
  await ctx.dispose();
  const item = listBody.results.find((it) => it.destination_city === city);
  if (!item) {
    throw new Error(
      `seedShipmentViaApi: city '${city}' not found after creation`
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
 * Default shipment payload for API seeding.
 * Uses backend FK field names (customer, origin_warehouse) not the _id form.
 */
const shipmentSeed = (label: string): Record<string, unknown> => ({
  customer: sharedCustomerId,
  origin_warehouse: sharedWarehouseId,
  destination_address: `Calle E2E ${RUN_ID} ${label}`,
  destination_city: sCity(label),
  destination_country: "Colombia",
  status: "PENDING",
  scheduled_date: "2025-12-31",
  shipping_cost: 50.0,
  total_weight_kg: 5.0,
  items: [{ product: sharedProductId, quantity: 1, unit_price: 9.99 }],
});

async function searchFor(page: Page, text: string) {
  await page.getByPlaceholder("Ciudad, país, dirección...").fill(text);
  await page.waitForTimeout(500);
}

const rowsWith = (page: Page, text: string) =>
  page.locator("tbody tr").filter({ hasText: text });

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe("Shipments CRUD", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeAll(async () => {
    sharedCustomerName = sName("Customer");
    sharedProductName = sName("Product");
    const warehouseName = sName("Warehouse");
    const supplierName = sName("Supplier");

    sharedWarehouseId = await seedViaApi("warehouses", {
      name: warehouseName,
      address: "Av. Bodega 1",
      city: "Bogotá",
      country: "Colombia",
      phone: "3001234567",
      capacity_m3: 100,
      is_active: true,
    });

    sharedSupplierId = await seedViaApi("suppliers", {
      name: supplierName,
      email: `e2e-ship-${RUN_ID}@test.com`,
      phone: "3001234567",
      address: "Calle Test 1",
      city: "Bogotá",
      country: "Colombia",
      tax_id: `STAX-${RUN_ID}`,
      is_active: true,
    });

    sharedCustomerId = await seedViaApi("customers", {
      name: sharedCustomerName,
      customer_type: "COMPANY",
      email: `cust-ship-${RUN_ID}@test.com`,
      phone: "3001234567",
      address: "Calle Cliente 1",
      city: "Bogotá",
      country: "Colombia",
      tax_id: `CTAX-${RUN_ID}`,
      is_active: true,
    });

    sharedProductId = await seedViaApi("products", {
      name: sharedProductName,
      supplier: sharedSupplierId,
      warehouse: sharedWarehouseId,
      sku: sSku("Prod"),
      description: "E2E product for shipments",
      category: "Test",
      unit_price: 9.99,
      weight_kg: 1.0,
      length_cm: 10.0,
      width_cm: 5.0,
      height_cm: 3.0,
      stock_quantity: 100,
      is_active: true,
    });
  });

  test.afterAll(async () => {
    // Remove in reverse dependency order.
    // Supplier deletion cascades to products; customer and warehouse are independent.
    await removeViaApi("products", sharedProductId).catch(() => {});
    await removeViaApi("customers", sharedCustomerId).catch(() => {});
    await removeViaApi("suppliers", sharedSupplierId).catch(() => {});
    await removeViaApi("warehouses", sharedWarehouseId).catch(() => {});
  });

  // ── 1. Crear ─────────────────────────────────────────────────────────────────
  test("crear: formulario completo → envío aparece en lista con id numérico", async ({
    page,
  }) => {
    const city = sCity("Crear");

    await page.goto("/shipments/new");
    await expect(
      page.getByRole("heading", { name: "Nuevo Envío" })
    ).toBeVisible({ timeout: 8_000 });

    // Customer select (combobox nth 0) — no blank option, select by name
    await page.locator('[role="combobox"]').nth(0).click();
    await expect(
      page.getByRole("option", { name: sharedCustomerName })
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole("option", { name: sharedCustomerName }).click();

    // Warehouse select (combobox nth 1) — pick first option in list
    await page.locator('[role="combobox"]').nth(1).click();
    await expect(page.getByRole("option").first()).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("option").first().click();

    // Destination section — inputs have htmlFor IDs
    await page.getByLabel("Dirección").fill("Av. E2E 123");
    await page.getByLabel("Ciudad").fill(city);
    await page.getByLabel("País").fill("Colombia");

    // Logistics section
    await page.locator("#scheduled_date").fill("2025-12-31");
    await page.locator("#shipping_cost").fill("75");
    await page.locator("#total_weight_kg").fill("10");

    // Add one item
    await page.getByRole("button", { name: "Agregar item" }).click();

    // Product select (last combobox added) — select by exact name
    await page.locator('[role="combobox"]').last().click();
    await expect(
      page.getByRole("option", { name: sharedProductName })
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole("option", { name: sharedProductName }).click();

    // Item quantity (idx 2) and price (idx 3) among all type=number inputs.
    // DOM order: shipping_cost(0), total_weight_kg(1), item.qty(2), item.price(3)
    const numInputs = page.locator("input[type='number']");
    await numInputs.nth(2).fill("2");
    await numInputs.nth(3).fill("15.00");

    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes("/shipments/") && r.request().method() === "POST",
      { timeout: 8_000 }
    );

    await page.getByRole("button", { name: "Crear envío" }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // On success the form navigates back to /shipments
    await page.waitForURL("**/shipments", { timeout: 8_000 });
    await expect(page).toHaveURL(/\/shipments$/);

    // The new shipment appears in the list
    await searchFor(page, city);
    const row = rowsWith(page, city);
    await expect(row).toHaveCount(1, { timeout: 8_000 });
    await expect(row.getByText(sharedCustomerName)).toBeVisible();
    await expect(row.getByText("Pendiente")).toBeVisible();

    // Cleanup: look up the created shipment by city and delete it
    try {
      const token = await apiToken();
      const ctx = await pwRequest.newContext({
        extraHTTPHeaders: { Authorization: `Bearer ${token}` },
      });
      const listR = await ctx.get(`${API_URL}/shipments/`, {
        params: { search: city, page_size: 5 },
      });
      const listBody = (await listR.json()) as {
        results: { id: number; destination_city: string }[];
      };
      await ctx.dispose();
      const found = listBody.results.find((it) => it.destination_city === city);
      if (found) await removeViaApi("shipments", found.id);
    } catch {
      // ignore cleanup errors
    }
  });

  // ── 2. Items (agregar vía edición) ────────────────────────────────────────
  test("items: editar envío → agregar segundo item → ambos visibles en detalle", async ({
    page,
  }) => {
    const id = await seedShipmentViaApi(shipmentSeed("Items"));

    try {
      await page.goto("/shipments");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Search and open edit form
      await searchFor(page, sCity("Items"));
      const row = rowsWith(page, sCity("Items"));
      await expect(row).toHaveCount(1);

      // Pencil = nth(1) in action buttons (Eye=0, Pencil=1, Trash=2)
      await row.locator("button").nth(1).click();
      await page.waitForURL(/\/shipments\/\d+\/edit/, { timeout: 5_000 });

      // Wait for detail to load — Customer combobox shows name when loaded
      await expect(page.locator('[role="combobox"]').nth(0)).not.toContainText(
        "Seleccionar",
        { timeout: 8_000 }
      );

      // Add a second item
      await page.getByRole("button", { name: "Agregar item" }).click();

      // Product select for new item (last combobox on page)
      await page.locator('[role="combobox"]').last().click();
      await expect(
        page.getByRole("option", { name: sharedProductName })
      ).toBeVisible({ timeout: 5_000 });
      await page.getByRole("option", { name: sharedProductName }).click();

      // Number inputs on edit page (existing item already has qty+price pre-filled):
      // shipping_cost(0), total_weight_kg(1), item1.qty(2), item1.price(3), item2.qty(4), item2.price(5)
      const numInputs = page.locator("input[type='number']");
      await numInputs.nth(5).fill("8.00"); // item2 unit_price (qty defaults to 1)

      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await page.waitForURL("**/shipments", { timeout: 8_000 });

      // Find the row and open detail dialog (Eye = first action button)
      await searchFor(page, sCity("Items"));
      const row2 = rowsWith(page, sCity("Items"));
      await expect(row2).toHaveCount(1, { timeout: 8_000 });
      await row2.locator("button").nth(0).click();

      // Detail dialog shows 2 item rows (each contains " × ")
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.locator("span").filter({ hasText: "×" })
      ).toHaveCount(2, { timeout: 5_000 });
    } finally {
      await removeViaApi("shipments", id).catch(() => {});
    }
  });

  // ── 3. Transición de status ───────────────────────────────────────────────
  test("status: PENDING → ASSIGNED reflejado en la lista tras editar", async ({
    page,
  }) => {
    const id = await seedShipmentViaApi(shipmentSeed("Status"));

    try {
      await page.goto("/shipments");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      // Verify initial status
      await searchFor(page, sCity("Status"));
      const row = rowsWith(page, sCity("Status"));
      await expect(row).toHaveCount(1);
      await expect(row.getByText("Pendiente")).toBeVisible();

      // Open edit
      await row.locator("button").nth(1).click();
      await page.waitForURL(/\/shipments\/\d+\/edit/, { timeout: 5_000 });

      // Wait for form to load
      await expect(page.locator('[role="combobox"]').nth(0)).not.toContainText(
        "Seleccionar",
        { timeout: 8_000 }
      );

      // Status is combobox nth 5 (Customer=0, Warehouse=1, Driver=2, Transport=3, Route=4, Status=5)
      await page.locator('[role="combobox"]').nth(5).click();
      await page.getByRole("option", { name: "Asignado" }).click();

      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await page.waitForURL("**/shipments", { timeout: 8_000 });

      // List should now show "Asignado"
      await searchFor(page, sCity("Status"));
      await expect(
        rowsWith(page, sCity("Status")).getByText("Asignado")
      ).toBeVisible({ timeout: 8_000 });
    } finally {
      await removeViaApi("shipments", id).catch(() => {});
    }
  });

  // ── 4. Eliminar ───────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog → envío desaparece de la lista", async ({
    page,
  }) => {
    const id = await seedShipmentViaApi(shipmentSeed("Eliminar"));

    try {
      await page.goto("/shipments");
      await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

      await searchFor(page, sCity("Eliminar"));
      const row = rowsWith(page, sCity("Eliminar"));
      await expect(row).toHaveCount(1);

      // Trash = nth(2) in action buttons
      await row.locator("button").nth(2).click();

      const alertDialog = page.getByRole("alertdialog");
      await expect(alertDialog).toBeVisible();
      // Dialog shows the shipment id as "#N" and the customer name
      await expect(alertDialog).toContainText(`#${id}`);
      await expect(alertDialog).toContainText(sharedCustomerName);

      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(alertDialog).toBeHidden({ timeout: 5_000 });
      await expect(rowsWith(page, sCity("Eliminar"))).toHaveCount(0, {
        timeout: 8_000,
      });
    } finally {
      await removeViaApi("shipments", id).catch(() => {});
    }
  });

  // ── 5. Validación ────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, no crea nada", async ({
    page,
  }) => {
    await page.goto("/shipments/new");
    await expect(
      page.getByRole("heading", { name: "Nuevo Envío" })
    ).toBeVisible({ timeout: 8_000 });

    // Submit with nothing filled
    await page.getByRole("button", { name: "Crear envío" }).click();

    await expect(page.getByText("Cliente requerido")).toBeVisible();
    await expect(page.getByText("Bodega requerida")).toBeVisible();
    await expect(page.getByText("Dirección requerida")).toBeVisible();
    await expect(page.getByText("Ciudad requerida")).toBeVisible();
    await expect(page.getByText("Agrega al menos un item")).toBeVisible();

    // Page stays on /shipments/new
    await expect(page).toHaveURL(/\/shipments\/new/);
  });
});
