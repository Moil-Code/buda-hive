import partnerEdcsData from './partnerEdcs.json';

export interface EdcFeatures {
  jobPosts: number;
  aiCoach: boolean;
  marketResearch: boolean;
  businessTemplates: boolean;
}

export interface PartnerEdc {
  id: string;
  name: string;
  fullName: string;
  programName: string;
  domain: string;
  city: string;
  state: string;
  country: string;
  primaryColor: string;
  accentColor: string;
  logoInitial: string;
  supportEmail: string;
  licenseDuration: string;
  features: EdcFeatures;
}

export const partnerEdcs: PartnerEdc[] = partnerEdcsData.partners as PartnerEdc[];

/**
 * Get a partner EDC by domain
 */
export function getEdcByDomain(domain: string): PartnerEdc | undefined {
  return partnerEdcs.find(edc => edc.domain === domain);
}

/**
 * Get a partner EDC by ID
 */
export function getEdcById(id: string): PartnerEdc | undefined {
  return partnerEdcs.find(edc => edc.id === id);
}

/**
 * Get a partner EDC by admin email domain
 */
export function getEdcByEmail(email: string): PartnerEdc | undefined {
  const domain = email.split('@')[1];
  return getEdcByDomain(domain);
}

/**
 * Check if a domain belongs to a partner EDC
 */
export function isPartnerEdcDomain(domain: string): boolean {
  return partnerEdcs.some(edc => edc.domain === domain);
}

/**
 * Get all valid partner EDC domains
 */
export function getPartnerEdcDomains(): string[] {
  return partnerEdcs.map(edc => edc.domain);
}

/**
 * Get the default EDC (Buda Hive)
 */
export function getDefaultEdc(): PartnerEdc {
  return partnerEdcs[0];
}
