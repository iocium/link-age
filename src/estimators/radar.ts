import { SignalResult } from '../utils';

export class RadarEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const endpoint = `https://api.cloudflare.com/client/v4/graphql`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.opts.userAgent
      },
      body: JSON.stringify({
        query: `{ domainRank(domain: "${domain}") { firstSeen } }`
      })
    });
    const json = await res.json();
    const firstSeen = json?.data?.domainRank?.firstSeen;
    if (!firstSeen) throw new Error('Radar: no firstSeen date available');
    return {
      source: 'radar',
      date: new Date(firstSeen),
      trustLevel: 'observed'
    };
  }
}