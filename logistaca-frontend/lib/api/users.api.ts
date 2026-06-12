import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { GroupItem, Permission, UserDetail, UserList, UserWrite } from '@/lib/types/users.types'

export const usersApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<UserList>>('/auth/users/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<UserDetail>(`/auth/users/${id}/`),

  create: (data: UserWrite) =>
    apiClient.post<UserDetail>('/auth/users/', data),

  update: (id: number, data: Partial<UserWrite>) =>
    apiClient.patch<UserDetail>(`/auth/users/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/auth/users/${id}/`),
}

export const groupsApi = {
  list: () =>
    apiClient.get<GroupItem[]>('/auth/groups/'),

  get: (id: number) =>
    apiClient.get<GroupItem>(`/auth/groups/${id}/`),

  create: (data: { name: string; permission_ids?: number[] }) =>
    apiClient.post<GroupItem>('/auth/groups/', data),

  update: (id: number, data: { name?: string; permission_ids?: number[] }) =>
    apiClient.patch<GroupItem>(`/auth/groups/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/auth/groups/${id}/`),
}

export const permissionsApi = {
  list: () =>
    apiClient.get<Permission[]>('/auth/permissions/'),
}
