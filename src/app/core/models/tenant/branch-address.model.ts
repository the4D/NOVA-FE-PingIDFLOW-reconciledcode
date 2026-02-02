export interface Address {
  id: string
  branchId: string
  streetNumber: string
  unitNumber: string
  street: string
  city: string
  province: number
  postalCode: string
  country: number
  addressType: number
}

export const addressInitialState = (): Address => ({
  id: '',
  branchId: '',
  streetNumber: '',
  unitNumber: '',
  street: '',
  city: '',
  province: 0,
  postalCode: '',
  country: 0,
  addressType: 0,
})