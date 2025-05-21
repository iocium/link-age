import { SignalResult } from '../utils';

export class CloudflareRadarEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const apiKey = this.opts.providerSecrets.cloudflareApiKey;
    if (!apiKey) return { source: 'cloudflare-radar', error: 'Missing Cloudflare API key' };
    const endpoint = `https://api.cloudflare.com/client/v4/graphql`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.opts.userAgent,
        Authorization: `Bearer ${this.opts.providerSecrets.cloudflareApiKey}`,
      },
      body: JSON.stringify({
        query: `{ domainRank(domain: "${domain}") { firstSeen } }`
      })
    });
    const json = await res.json();
    console.log(json)
    const firstSeen = json?.data?.domainRank?.firstSeen;
    if (!firstSeen) throw new Error('Cloudflare Radar: no firstSeen date available');
    return {
      source: 'cloudflare-radar',
      date: new Date(firstSeen),
      trustLevel: 'observed'
    };
  }
}