import { SignalResult } from '../utils';

export class WaybackEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const url = new URL(input).toString();
    const res = await fetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=1&fl=timestamp&sort=asc`, {
      headers: { 'User-Agent': this.opts.userAgent }
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) throw new Error('No Wayback Machine data available');
    const ts = data[1][0];
    const date = new Date(`${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)}T00:00:00Z`);
    return {
      source: 'wayback',
      date,
      trustLevel: 'observed',
      weight: 0.6
    };
  }
}