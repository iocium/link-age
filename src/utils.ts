export interface SignalResult {
  source: string;
  date?: Date;
  trustLevel?: 'authoritative' | 'observed' | 'inferred' | 'negative';
  weight?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface LinkAgeOptions {
  enableWhois?: boolean;
  enableCt?: boolean;
  enableDns?: boolean;
  enableWayback?: boolean;
  enableUrlscan?: boolean;
  enableShodan?: boolean;
  enableRevocation?: boolean;
  enableRadar?: boolean;
  enableCensys?: boolean;
  enableSafeBrowsing?: boolean;
  timeoutMs?: number;
  concurrencyLimit?: number;
  stopOnConfidence?: {
    minSignals: number;
    withinDays: number;
  };
  userAgent?: string;
  providerSecrets?: Record<string, string | undefined>;
  logHandler?: (msg: string) => void;
  input?: string;
  corsProxy?: string;
}

export interface LinkAgeResult {
  input: string;
  signals: SignalResult[];
  earliest?: Date;
  score: number;
  confidence: 'none' | 'low' | 'medium' | 'high';
  humanReadable: string;
}