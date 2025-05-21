import { SignalResult } from '../utils';
import { CloudflareOptions } from './providerOptions';

export class CloudflareRadarEstimator {
  constructor(private opts: CloudflareOptions) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = this.getDomain(input);
    const apiKey = this.opts.providerSecrets.cloudflareApiKey;

    if (!apiKey) return this.createErrorResponse('Missing Cloudflare API key');

    const url = this.buildUrl();
    
    try {
      const response = await this.fetchData(url, domain);
      const firstSeen = this.extractFirstSeen(response);

      return this.createSuccessResponse(firstSeen);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  private getDomain(input: string): string {
    return new URL(input).hostname.replace(/^www\./, '');
  }

  private buildUrl(): string {
    const endpoint = 'https://api.cloudflare.com/client/v4/graphql';
    return this.opts.corsProxy 
      ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}`
      : endpoint;
  }

  private async fetchData(url: string, domain: string): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.opts.providerSecrets.cloudflareApiKey}`,
    };
    // Only add User-Agent header if it's defined
    if (this.opts.userAgent) {
      headers['User-Agent'] = this.opts.userAgent;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `{ domainRank(domain: "${domain}") { firstSeen } }`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }

  private extractFirstSeen(json: any): Date {
    const firstSeen = json?.data?.domainRank?.firstSeen;
    if (!firstSeen) {
      throw new Error('Cloudflare Radar: no firstSeen date available');
    }
    return new Date(firstSeen);
  }

  private createSuccessResponse(firstSeen: Date): SignalResult {
    return {
      source: 'cloudflare-radar',
      date: firstSeen,
      trustLevel: 'observed',
    };
  }

  private createErrorResponse(message: string): SignalResult {
    return {
      source: 'cloudflare-radar',
      error: message,
    };
  }
}