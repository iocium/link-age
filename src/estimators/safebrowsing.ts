import { SignalResult } from '../utils';

export class SafeBrowsingEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const url = new URL(input).hostname;
    const res = await fetch(`https://transparencyreport.google.com/safe-browsing/search?url=${url}`, {
      headers: { 'User-Agent': this.opts.userAgent }
    });
    const text = await res.text();
    const flagged = /dangerous|deceptive|phishing|malware|harmful/i.test(text);
    if (flagged) {
      return {
        source: 'safebrowsing',
        date: new Date(),
        trustLevel: 'inferred',
        weight: 0.5
      };
    }
    throw new Error('SafeBrowsing: no flags detected');
  }
}