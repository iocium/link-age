import { SignalResult } from '../utils';

export class CensysEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = this.getDomain(input);
    const auth = this.getAuth();
    const url = this.buildUrl(domain);

    const res = await this.fetchData(url, auth);
    
    const firstSeen = await this.extractFirstSeen(res);
    return this.createResult(firstSeen);
  }

  private getDomain(input: string): string {
    return new URL(input).hostname.replace(/^www\./, '');
  }

  private getAuth(): string {
    const { censysApiId, censysApiSecret } = this.opts.providerSecrets || {};
    if (!censysApiId || !censysApiSecret) {
      throw new Error('Censys API credentials missing');
    }
    return Buffer.from(`${censysApiId}:${censysApiSecret}`).toString('base64');
  }

  private buildUrl(domain: string): string {
    const endpoint = `https://search.censys.io/api/v2/hosts/search?q=${encodeURIComponent(domain)}`;
    return this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` : endpoint;
  }

  private async fetchData(url: string, auth: string): Promise<Response> {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'User-Agent': this.opts.userAgent
      },
    });
    if (!res.ok) {
      throw new Error(`Censys API error: ${res.status}`);
    }
    return res;
  }

  private async extractFirstSeen(res: Response): Promise<string> {
    const json = await res.json();
    const firstSeen = json?.result?.hits?.[0]?.first_seen;
    if (!firstSeen) {
      throw new Error('Censys: no first_seen date available');
    }
    return firstSeen;
  }

  private createResult(firstSeen: string): SignalResult {
    return {
      source: 'censys',
      date: new Date(firstSeen),
      trustLevel: 'observed',
    };
  }
}