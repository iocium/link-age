import { SignalResult } from '../utils';

export class CensysEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const { censysApiId, censysApiSecret } = this.opts.providerSecrets || {};
    if (!censysApiId || !censysApiSecret) throw new Error('Censys API credentials missing');
    const auth = Buffer.from(`${censysApiId}:${censysApiSecret}`).toString('base64');
    const endpoint = 'https://search.censys.io/api/v2/hosts/search?q=' + encodeURIComponent(domain)
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'User-Agent': this.opts.userAgent
      }
    });
    if (!res.ok) throw new Error(`Censys API error: ${res.status}`);
    const json = await res.json();
    const firstSeen = json?.result?.hits?.[0]?.first_seen;
    if (!firstSeen) throw new Error('Censys: no first_seen date available');
    return {
      source: 'censys',
      date: new Date(firstSeen),
      trustLevel: 'observed'
    };
  }
}