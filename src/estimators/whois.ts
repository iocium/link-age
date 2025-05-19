import { SignalResult } from '../utils';

export class WhoisEstimator {
  constructor(private opts: {
    corsProxy?: string;
    userAgent?: string;
  }) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const endpoint = `https://rdap.org/domain/${domain}`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.opts.userAgent ?? 'iocium/link-age (browser)' }
    });
    if (!res.ok) throw new Error(`WHOIS fetch failed: ${res.status}`);
    const data = await res.json();
    const date = new Date(data.events?.find((e: any) => e.eventAction === 'registration')?.eventDate);
    if (!date || isNaN(date.getTime())) throw new Error('Invalid WHOIS registration date');
    return {
      source: 'whois',
      date,
      trustLevel: 'authoritative',
      weight: 1.0
    };
  }
}