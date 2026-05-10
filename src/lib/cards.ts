/** Resolves card image URLs from the API's relative paths */
export function getCardImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return ""
  // The API stores relative paths like /images/amex/delta-skymiles-blue.jpg
  // The actual images are hosted on offeroptimist.com
  return `https://www.offeroptimist.com${imageUrl}`
}

/** Format issuer name for display */
export function formatIssuer(issuer: string): string {
  const map: Record<string, string> = {
    AMERICAN_EXPRESS: "Amex",
    CHASE: "Chase",
    CITI: "Citi",
    CAPITAL_ONE: "Capital One",
    BANK_OF_AMERICA: "Bank of America",
    WELLS_FARGO: "Wells Fargo",
    US_BANK: "US Bank",
    BARCLAYS: "Barclays",
    DISCOVER: "Discover",
  }
  return map[issuer] || issuer.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export interface CardData {
  cardId: string
  name: string
  issuer: string
  network: string
  currency: string
  isBusiness: boolean
  annualFee: number
  isAnnualFeeWaived: boolean
  universalCashbackPercent: number
  url: string
  imageUrl: string
  credits: any[]
  offers: any[]
  historicalOffers: any[]
  discontinued: boolean
}
