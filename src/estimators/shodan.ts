import { SignalResult } from '../utils';

export class ShodanEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const key = this.opts.providerSecrets?.shodanApiKey;
    if (!key) throw new Error('Missing Shodan API key');

    const endpoint = `https://api.shodan.io/dns/domain/${domain}?key=${key}`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.opts.userAgent }
    });

    if (!res.ok) throw new Error(`Shodan API request failed: ${res.status}`);
    const json = await res.json();

    const timestamps = (json.data || [])
      .map((entry: any) => new Date(entry.last_seen))
      .filter((d: Date) => !isNaN(d.getTime()))

    if (!timestamps.length) throw new Error('No Shodan data found');

    const earliest = new Date(Math.min(...timestamps.map((d: Date) => d.getTime())));

    return {
      source: 'shodan',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.6
    };
  }
}