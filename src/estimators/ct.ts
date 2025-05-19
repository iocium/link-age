import { SignalResult } from '../utils';

export class CTEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const endpoint = `https://crt.sh/?q=${domain}&output=json`;
    const url = this.opts.corsProxy 
      ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` 
      : endpoint;

    const res = await fetch(url, {
      headers: { 'User-Agent': this.opts.userAgent }
    });

    if (!res.ok) {
      throw new Error(`CT log query failed with status ${res.status}`);
    }

    const entries = await res.json() as { not_before: string }[];
    
    // Create an array of unique timestamps
    const notBeforeTimestamps = Array.from(
      new Set(entries.map(entry => new Date(entry.not_before).getTime()))
    );

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
}