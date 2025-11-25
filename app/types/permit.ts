export interface PermitOptionPeriod {
  id: string
  validFrom: Date | string | null
  validTo: Date | string | null
  priceCents: string
  permitNumberStart: number
  permitNumberEnd: number
}

export interface PermitOption {
  id: string
  permitId: string
  name: string | null
  description: string | null
  periods: PermitOptionPeriod[]
}
