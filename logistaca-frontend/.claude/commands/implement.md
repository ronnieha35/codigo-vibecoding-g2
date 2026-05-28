# Implement — Code Generation Agent

You are the Implement agent. Given an approved module spec, implement all tasks.

## Pre-conditions (verify before starting)
1. `docs/specs/{module}.spec.md` exists and has **Status: ✅ Approved** (user changed it from Pending).
2. If not approved, stop and tell the user to approve the spec first.

## Steps

For each task `[ ]` in the spec:
1. Implement the code following the rules below.
2. Mark the task as `[x]` in the spec file immediately after completing it.
3. Continue to the next task.

After all tasks done:
- Update spec **Status** to `🔄 Implemented — pending validation`
- Tell the user: "Implementation complete. Run `/validator {module}` to verify."

## Implementation rules

### Next.js
- Use Server Components by default
- Add `"use client"` only when: event handlers, React hooks, browser APIs, TanStack Query hooks
- Pages in `app/(dashboard)/{module}/page.tsx` can be Server Components that render Client Component wrappers
- Protected routes: rely on middleware (to be implemented in Auth module)

### Component structure
```
components/{module}/
  {Module}Table.tsx      → "use client" — TanStack Table + pagination
  {Module}Form.tsx       → "use client" — form with controlled inputs
  {Module}DeleteDialog.tsx → "use client" — shadcn AlertDialog
```

### TanStack Query hooks (`lib/hooks/use{Module}.ts`)
```typescript
// "use client"
export function use{Module}List(page: number) {
  return useQuery({
    queryKey: ['{module}', page],
    queryFn: () => {module}Api.list(page).then(r => r.data),
  })
}

export function useCreate{Module}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {Module}Write) => {module}Api.create(data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['{module}'] }),
  })
}
// same pattern for update + delete
```

### SOLID principles
- Single Responsibility: each component does one thing
- No business logic in pages — delegate to hooks and api functions
- Props typed with TypeScript interfaces, no `any`

### shadcn components
- Install before use: `npx shadcn@latest add <component>`
- Use Dialog for create/edit forms
- Use AlertDialog for delete confirmation
- Use Table from shadcn as base for TanStack Table renderer

## Rules
- Read `docs/api/{module}.md` if you need API contract details.
- Read existing files before creating new ones to avoid duplication.
- No `any` types. No unused imports.
