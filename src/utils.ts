/**
 * Represents the result from a signal source.
 */
export interface SignalResult {
  /** The source of the signal (e.g., Certificate Transparency, Wayback Machine). */
  source: string;
  
  /** The date associated with the signal, if available. */
  date?: Date;
  
  /** The trust level of the signal, which can be one of: 
   * 'authoritative', 'observed', 'inferred', or 'negative'.
   */
  trustLevel?: 'authoritative' | 'observed' | 'inferred' | 'negative';
  
  /** A weight assigned to the signal, indicating its importance or reliability. */
  weight?: number;
  
  /** An error message, if any occurred while retrieving the signal. */
  error?: string;
  
  /** Additional metadata related to the signal. */
  metadata?: Record<string, any>;
}

/**
 * Options for configuring the Link-Age estimation process.
 */
export interface LinkAgeOptions {
  /** Enable WHOIS lookup for domain information. */
  enableWhois?: boolean;

  /** Enable Certificate Transparency checks. */
  enableCt?: boolean;

  /** Enable DNS checks. */
  enableDns?: boolean;

  /** Enable Wayback Machine checks. */
  enableWayback?: boolean;

  /** Enable urlscan.io checks. */
  enableUrlscan?: boolean;

  /** Enable Shodan API checks. */
  enableShodan?: boolean;

  /** Enable revocation status checks. */
  enableRevocation?: boolean;

  /** Enable Cloudflare checks. */
  enableCloudflareUrlscan?: boolean;

  /** Enable Censys checks. */
  enableCensys?: boolean;

  /** Enable Google Safe Browsing checks. */
  enableSafeBrowsing?: boolean;

  /** Enable Common Crawl checks. */
  enableCommonCrawl?: boolean;

  /** Timeout in milliseconds for requests. */
  timeoutMs?: number;

  /** Limit on the number of concurrent requests. */
  concurrencyLimit?: number;

  /** Stop processing when a minimum confidence level is reached. */
  stopOnConfidence?: {
    /** Minimum number of signals required to stop. */
    minSignals: number;
    
    /** Time frame in days within which the signals must be found. */
    withinDays: number;
  };

  /** User agent string to use for requests. */
  userAgent?: string;

  /** Secrets for providers, such as API keys. */
  providerSecrets?: Record<string, string | undefined>;

  /** Function to handle log messages. */
  logHandler?: (msg: string) => void;

  /** Input URL or domain for which the age is being estimated. */
  input?: string;

  /** CORS proxy to use for requests. */
  corsProxy?: string;

  /** A list of user supplied, or external / internal plugins */
  plugins?: LinkAgePlugin[];
}

/**
 * Result of the Link-Age estimation process.
 */
export interface LinkAgeResult {
  /** The input URL or domain that was analyzed. */
  input: string;

  /** Array of signals obtained during the analysis. */
  signals: SignalResult[];

  /** The earliest date found across all signals, if available. */
  earliest?: Date;

  /** Overall score representing the link age estimate. */
  score: number;

  /** Confidence level of the estimation, can be 'none', 'low', 'medium', or 'high'. */
  confidence: 'none' | 'low' | 'medium' | 'high';

  /** Human-readable description of the estimation result. */
  humanReadable: string;
}

/**
 * Represents a plugin for estimating link age.
 *
 * @interface LinkAgePlugin
 */
export interface LinkAgePlugin {
  /**
   * The source of the link age estimation.
   *
   * @type {string}
   */
  source: string;

  /**
   * Estimates the link age based on the provided input.
   *
   * @param {string} input - The input URL or domain to estimate the link age for.
   * @returns {Promise<SignalResult>} A promise that resolves to the signal result of the estimation.
   */
  estimate(input: string): Promise<SignalResult>;

  /**
   * Optional setup method to configure the plugin with specific options.
   *
   * @param {LinkAgeOptions} options - The options to configure the plugin.
   */
  setup?(options: LinkAgeOptions): void;
}