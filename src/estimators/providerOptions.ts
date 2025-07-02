/**
 * Options for configuring Censys integration.
 *
 * @interface CensysOptions
 * @property {Object} providerSecrets - Secrets required for Censys API authentication.
 * @property {string} providerSecrets.censysApiId - The API ID for accessing Censys services.
 * @property {string} providerSecrets.censysApiSecret - The API secret for accessing Censys services.
 * @property {string} [corsProxy] - Optional CORS proxy URL for making requests.
 * @property {string} [userAgent] - Optional user agent string to be used in requests.
 */
export interface CensysOptions {
  /** Censys API credentials; both id and secret are optional here, runtime will validate presence */
  providerSecrets?: {
    censysApiId?: string;
    censysApiSecret?: string;
  };
  corsProxy?: string;
  userAgent?: string;
}

/**
 * Options for configuring Cloudflare integration.
 *
 * @interface CloudflareOptions
 * @property {Object} providerSecrets - Secrets required for Cloudflare API authentication.
 * @property {string} providerSecrets.cloudflareAccountId - The Cloudflare account ID.
 * @property {string} providerSecrets.cloudflareApiKey - The API key for accessing Cloudflare services.
 * @property {string} [corsProxy] - Optional CORS proxy URL for making requests.
 * @property {string} [userAgent] - Optional user agent string to be used in requests.
 */
export interface CloudflareOptions {
  providerSecrets: {
    cloudflareAccountId: string;
    cloudflareApiKey: string;
  };
  corsProxy?: string;
  userAgent?: string;
}