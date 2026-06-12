import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join("playwright", ".auth", "user.json");

const API_URL =
  process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

setup("authenticate", async ({ page, request }) => {
  // Obtain tokens directly from the API — faster than UI login.
  const res = await request.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Auth token request failed (${res.status()}): ${body}`);
  }

  const { access, refresh } = await res.json();

  // Fetch user profile so the seeded state includes is_superuser — prevents a
  // race condition where useCanModule() returns canAdd:false before useMe() resolves.
  const meRes = await request.get(`${API_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  const user = meRes.ok() ? await meRes.json() : null;

  // Navigate to origin so we can write into its localStorage.
  const baseURL =
    process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(baseURL);

  // Seed Zustand persist storage — key must match auth.store.ts `name: "logistaca-auth"`.
  await page.evaluate(
    ({ token, refreshToken, user }) => {
      localStorage.setItem(
        "logistaca-auth",
        JSON.stringify({
          state: { token, refreshToken, user },
          version: 0,
        })
      );
    },
    { token: access, refreshToken: refresh, user }
  );

  // Seed the middleware cookie (logistaca-token) so server-side auth guard passes.
  await page.context().addCookies([
    {
      name: "logistaca-token",
      value: access,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 3600,
    },
  ]);

  await page.context().storageState({ path: authFile });
});
