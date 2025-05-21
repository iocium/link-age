import { SignalResult } from '../utils';

export class CloudflareUrlscanEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const accountId = this.opts.providerSecrets.cloudflareAccountId;
    const apiKey = this.opts.providerSecrets.cloudflareApiKey;
    if (!accountId) return { source: 'cloudflare-urlscan', error: 'Missing Cloudflare Account ID' };
    if (!apiKey) return { source: 'cloudflare-urlscan', error: 'Missing Cloudflare API key' };
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?q=page.domain:${domain}`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.opts.providerSecrets.cloudflareApiKey}`,
        'User-Agent': this.opts.userAgent,
      }
    });
    const json = await res.json();
    const timestamps = json.results?.map((r: any) => new Date(r.task.time)).filter((d: Date) => !isNaN(d.getTime()));
    if (!timestamps?.length) throw new Error('No historical Cloudflare data found');
    const earliest = new Date(Math.min(...timestamps.map((d: Date) => d.getTime())));
    return {
      source: 'cloudflare-urlscan',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.7
    };
  }
}