'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi, permissionsApi, usersApi } from '@/lib/api/users.api'
import type { UserWrite } from '@/lib/types/users.types'

const USERS_KEY = 'users'
const GROUPS_KEY = 'groups'
const PERMISSIONS_KEY = 'permissions'

export function useUserList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [USERS_KEY, page, pageSize],
    queryFn: () => usersApi.list(page, pageSize).then((r) => r.data),
  })
}

export function useGroupList() {
  return useQuery({
    queryKey: [GROUPS_KEY],
    queryFn: () => groupsApi.list().then((r) => r.data),
    staleTime: Infinity,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UserWrite) => usersApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserWrite>) => usersApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; permission_ids?: number[] }) => groupsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GROUPS_KEY] }),
  })
}

export function useUpdateGroup(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; permission_ids?: number[] }) => groupsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GROUPS_KEY] }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => groupsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GROUPS_KEY] }),
  })
}

export function usePermissionList() {
  return useQuery({
    queryKey: [PERMISSIONS_KEY],
    queryFn: () => permissionsApi.list().then((r) => r.data),
    staleTime: Infinity,
  })
}
