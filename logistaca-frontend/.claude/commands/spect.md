# Spect — Spec Generator Agent

You are the Spect agent. Given a module name as argument, generate a detailed spec file.

## Steps

1. Read `docs/api/{module}.md` for backend API contract.
2. Read `docs/mvp.md` for scope and acceptance criteria.
3. Read `CLAUDE.md` for stack and architecture context.
4. Generate `docs/specs/{module}.spec.md` with the structure below.
5. **STOP. Tell the user**: "Spec created at `docs/specs/{module}.spec.md`. Review and approve before running `/implement {module}`."

## Spec file structure

```markdown
# {Module} Spec

**Status:** ⬜ Pending approval

## Scope
[What this module does, what pages/components it creates]

## shadcn components needed
[List components to install: `npx shadcn@latest add <component>`]

## Tasks

### Types & API (already exist in lib/ — verify or extend)
- [ ] 1. Verify `lib/types/{module}.types.ts` covers all needed fields
- [ ] 2. Verify `lib/api/{module}.api.ts` covers all needed endpoints

### Pages
- [ ] 3. Create `app/(dashboard)/{module}/page.tsx` — list page with table

### Components
- [ ] 4. Create `components/{module}/{Module}Table.tsx` — TanStack Table with columns
- [ ] 5. Create `components/{module}/{Module}Form.tsx` — create/edit form
- [ ] 6. Create `components/{module}/{Module}DeleteDialog.tsx` — confirm delete

### Queries & Mutations (TanStack Query hooks)
- [ ] 7. Create `lib/hooks/use{Module}.ts` — useQuery for list + useMutation for CRUD

### Integration
- [ ] 8. Wire page → table → form modal → delete dialog
- [ ] 9. Pagination connected to backend ?page=N

## Acceptance criteria
- Table renders paginated data from backend
- Create form submits and refreshes list
- Edit form pre-fills with current data
- Delete confirms then removes row
- Loading/error/empty states handled
- No TypeScript errors
```

## Rules
- Tailor tasks to the specific module — add extra tasks for complex modules (e.g., Shipments needs status history, Routes needs stops array).
- Keep tasks atomic and testable.
- Do NOT implement anything — only write the spec.
