/**
 * Sale Period Helper
 *
 * Handles calculation of the current sale period based on club's
 * permitSaleStart and permitSaleEnd settings (DD-MM format).
 *
 * Sale periods can span across years (e.g., Nov 1 to Mar 31).
 */

export interface SalePeriodRange {
  start: Date
  end: Date
}

/**
 * Parse DD-MM string to day and month numbers
 */
const parseDDMM = (ddmm: string): { day: number, month: number } => {
  const parts = ddmm.split('-').map(Number)
  return { day: parts[0] ?? 1, month: parts[1] ?? 1 }
}

/**
 * Calculate the current sale period date range.
 *
 * @param permitSaleStart - Start date in DD-MM format (e.g., "01-11" for Nov 1)
 * @param permitSaleEnd - End date in DD-MM format (e.g., "31-03" for Mar 31)
 * @param referenceDate - Date to check against (defaults to now)
 * @returns The date range of the current sale period, or null if not configured
 *
 * @example
 * // Sale period Nov 1 to Mar 31
 * // If today is Jan 15, 2025 → returns { start: Nov 1, 2024, end: Mar 31, 2025 }
 * // If today is Jun 1, 2025 → returns null (outside sale period)
 */
export const getCurrentSalePeriod = (
  permitSaleStart: string | null,
  permitSaleEnd: string | null,
  referenceDate = new Date(),
): SalePeriodRange | null => {
  if (!permitSaleStart || !permitSaleEnd) {
    return null
  }

  const start = parseDDMM(permitSaleStart)
  const end = parseDDMM(permitSaleEnd)

  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1 // 1-indexed

  // Determine if the sale period spans across years
  // e.g., start: Nov (11), end: Mar (3) → spans years
  const spansYears = start.month > end.month

  let startYear: number
  let endYear: number

  if (spansYears) {
    // Period spans across years (e.g., Nov-Mar)
    // Check if we're in the "start year" portion (Nov-Dec) or "end year" portion (Jan-Mar)
    if (refMonth >= start.month) {
      // We're in Nov-Dec of the start year
      startYear = refYear
      endYear = refYear + 1
    }
    else if (refMonth <= end.month) {
      // We're in Jan-Mar of the end year
      startYear = refYear - 1
      endYear = refYear
    }
    else {
      // We're outside the sale period (e.g., Apr-Oct)
      // Return the most recent completed or upcoming sale period
      // For order checking, return the upcoming period
      startYear = refYear
      endYear = refYear + 1
    }
  }
  else {
    // Period within same year (e.g., Jan-Dec or Mar-Oct)
    startYear = refYear
    endYear = refYear
  }

  // Create date objects (months are 0-indexed in JavaScript)
  const startDate = new Date(startYear, start.month - 1, start.day, 0, 0, 0, 0)
  const endDate = new Date(endYear, end.month - 1, end.day, 23, 59, 59, 999)

  return {
    start: startDate,
    end: endDate,
  }
}

/**
 * Check if a date falls within a sale period range.
 */
export const isDateInSalePeriod = (
  date: Date,
  salePeriod: SalePeriodRange,
): boolean => {
  return date >= salePeriod.start && date <= salePeriod.end
}

/**
 * Check if we're currently within the sale period.
 */
export const isCurrentlyInSalePeriod = (
  permitSaleStart: string | null,
  permitSaleEnd: string | null,
  referenceDate = new Date(),
): boolean => {
  const period = getCurrentSalePeriod(permitSaleStart, permitSaleEnd, referenceDate)
  if (!period) {
    return false
  }
  return isDateInSalePeriod(referenceDate, period)
}
