import { test as base, request } from "@playwright/test";

const API_URL =
  process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

type ApiHelper = {
  get: (endpoint: string) => Promise<unknown>;
  post: (endpoint: string, data: Record<string, unknown>) => Promise<unknown>;
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>;
  remove: (endpoint: string, id: number) => Promise<void>;
};

type Fixtures = {
  api: ApiHelper;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    // Obtain fresh JWT for the fixture's request context.
    const anonCtx = await request.newContext();
    const tokenRes = await anonCtx.post(`${API_URL}/auth/token/`, {
      data: { username: USERNAME, password: PASSWORD },
    });
    const { access } = await tokenRes.json();
    await anonCtx.dispose();

    const ctx = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${access}` },
    });

    await use({
      get: async (endpoint) => {
        const r = await ctx.get(`${API_URL}/${endpoint}/`);
        return r.json();
      },
      post: async (endpoint, data) => {
        const r = await ctx.post(`${API_URL}/${endpoint}/`, { data });
        return r.json();
      },
      seed: async (endpoint, payload) => {
        const r = await ctx.post(`${API_URL}/${endpoint}/`, { data: payload });
        const body = (await r.json()) as { id: number };
        return body.id;
      },
      remove: async (endpoint, id) => {
        await ctx.delete(`${API_URL}/${endpoint}/${id}/`);
      },
    });

    await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
