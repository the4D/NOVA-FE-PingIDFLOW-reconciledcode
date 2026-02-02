export interface Tenant {
  id: string
  name: string
  code: string
  description: string
}

export const tenantInitialState = (): Tenant => ({
  id: '',
  name: '',
  code: '',
  description: ''
})