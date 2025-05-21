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