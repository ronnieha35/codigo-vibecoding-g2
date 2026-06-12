export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface GroupItem {
  id: number
  name: string
  permissions?: Permission[]
}

export interface UserList {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
  groups: GroupItem[]
  date_joined: string
}

export type UserDetail = UserList

export interface UserWrite {
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  password?: string
  groups: number[]
}
