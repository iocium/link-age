import { SignalResult } from '../utils';

export class SafeBrowsingEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const uri = new URL(input).hostname;
    const endpoint = `https://transparencyreport.google.com/safe-browsing/search?url=${uri}`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
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