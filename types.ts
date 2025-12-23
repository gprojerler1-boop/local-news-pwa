

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishTime: string; // ISO string
  serverTimestamp: string; // ISO string
  fingerprint: string;
  matchedKeywords: string[];
  isTelegram: boolean;
  screenshot?: string; // Data URL
  originalPostData?: any;
  // Added for Search Grounding URLs
  groundingSources?: Array<{ uri: string; title: string }>;
}

export interface AppSettings {
  webSources: string[];
  telegramSources: string[];
  keywords: string[];
  refreshInterval: number; // minutes
  lastUpdated: string;
}

export enum NewsStatus {
  Valid = 'valid',
  RejectedDuplicate = 'rejected_duplicate',
  RejectedOld = 'rejected_old',
  RejectedTimeDiscrepancy = 'rejected_time_discrepancy',
  RejectedNoMatch = 'rejected_no_match'
}