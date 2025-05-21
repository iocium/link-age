import { SignalResult } from '../utils';
import { CloudflareOptions } from './providerOptions';

export class CloudflareUrlscanEstimator {
  constructor(private opts: CloudflareOptions) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = this.extractDomain(input);
    const { cloudflareAccountId: accountId, cloudflareApiKey: apiKey } = this.opts.providerSecrets;

    // Validate required credentials
    if (!accountId) return this.createErrorResponse('Missing Cloudflare Account ID');
    if (!apiKey) return this.createErrorResponse('Missing Cloudflare API key');

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?q=page.domain:${domain}`;
    const url = this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` : endpoint;

    try {
      const headers: HeadersInit = {
        Authorization: `Bearer ${apiKey}`,
      };
      // Only add User-Agent header if it's defined
      if (this.opts.userAgent) {
        headers['User-Agent'] = this.opts.userAgent;
      }
      const res = await fetch(url, {
        headers,
      });

      const json = await res.json();
      const timestamps = this.extractTimestamps(json.results);

      if (!timestamps.length) throw new Error('No historical Cloudflare data found');
      
      const earliest = new Date(Math.min(...timestamps));
      return this.createSuccessResponse(earliest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return this.createErrorResponse(message);
    }
  }

  private extractDomain(input: string): string {
    return new URL(input).hostname.replace(/^www\./, '');
  }

  private extractTimestamps(results: any[]): number[] {
    return results?.map((r) => new Date(r.task.time).getTime()).filter(time => !isNaN(time)) || [];
  }

  private createSuccessResponse(date: Date): SignalResult {
    return {
      source: 'cloudflare-urlscan',
      date,
      trustLevel: 'observed',
      weight: 0.7,
    };
  }

  private createErrorResponse(message: string): SignalResult {
    return {
      source: 'cloudflare-urlscan',
      error: message,
    };
  }
}