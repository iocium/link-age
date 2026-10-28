import { SignalResult } from '../utils';

export class CTEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const url = this.buildUrl(domain);
    const headers: HeadersInit = { 'User-Agent': this.opts.userAgent };

    // Cert Spotter works without a key (100 lookups/hour), but an API key
    // raises the rate limit and is used when available.
    const apiKey = this.opts.providerSecrets?.certspotterApiKey;
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`CT log query failed with status ${res.status}`);
    }

    const entries = await res.json() as { not_before: string }[];

    // Create an array of unique timestamps
    const notBeforeTimestamps = Array.from(
      new Set(entries.map(entry => new Date(entry.not_before).getTime()))
    ).filter(t => !isNaN(t));

    if (notBeforeTimestamps.length === 0) {
      throw new Error('CT logs returned no valid certificate dates');
    }

    // Find the earliest date by using Math.min on the timestamps
    const earliestTimestamp = Math.min(...notBeforeTimestamps);
    const earliest = new Date(earliestTimestamp);

    return {
      source: 'ct',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.75
    };
  }

  private buildUrl(domain: string): string {
    const endpoint = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=false&match_wildcards=true`;
    return this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` : endpoint;
  }
}
