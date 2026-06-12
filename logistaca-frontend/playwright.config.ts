/**
 * PREREQUISITES — must be running before `npm run e2e`:
 *   1. Django API:   cd ../logistica-api && python manage.py runserver 8000
 *   2. Next.js dev:  npm run dev  (port 3000)
 *   3. Test user:    python manage.py shell -c "
 *                      from django.contrib.auth.models import User
 *                      User.objects.create_superuser('testuser', 'test@example.com', 'testpass123')"
 *
 * webServer is intentionally absent — servers are managed manually per project convention.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /login\.spec\.ts/],
    },
    {
      name: "chromium-unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /login\.spec\.ts/,
    },
  ],
});
