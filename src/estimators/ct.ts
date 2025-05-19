import { SignalResult } from '../utils';

export class CTEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const res = await fetch(`https://crt.sh/?q=${domain}&output=json`, {
      headers: { 'User-Agent': this.opts.userAgent }
    });
    if (!res.ok) throw new Error(`CT log query failed with status ${res.status}`);
    const json = await res.json();
    const entries = json as { not_before: string }[];
    const notBeforeDates: Date[] = Array.from(
      new Set(entries.map(entry => entry.not_before))
    ).map((d: string) => new Date(d));    
    if (!notBeforeDates.length) throw new Error('CT logs returned no valid certificate dates');
    const issued = notBeforeDates.map(d => d.toISOString());
    const earliest = new Date(Math.min(...notBeforeDates.map(d => d.getTime())));
    return {
      source: 'ct',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.75
    };
  }
}