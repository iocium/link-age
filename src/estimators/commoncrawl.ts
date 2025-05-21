import { SignalResult } from '../utils';

const INDEXES = [
  'CC-MAIN-2025-18-index',
  'CC-MAIN-2025-13-index',
  'CC-MAIN-2025-08-index',
];

export class CommonCrawlEstimator {
  constructor(
    private opts: {
      corsProxy?: string;
      userAgent: string;
      cache?: {
        get: (key: string) => Promise<any>;
        set: (key: string, val: any, ttl: number) => Promise<void>;
      };
    }
  ) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const cacheKey = `commoncrawl:${domain}`;
    const headers = { 'User-Agent': this.opts.userAgent };

    // Check cache first
    const cached = this.opts.cache ? await this.opts.cache.get(cacheKey) : null;
    if (cached) {
      return this.createResponse('cache', new Date(cached.timestamp), 0.6);
    }

    for (const index of INDEXES) {
      const url = this.constructUrl(domain, index);

      try {
        const res = await fetch(url, { headers });
        if (!res.ok) continue;

        const timestamps = await this.extractTimestamps(res);
        if (timestamps.length) {
          const earliest = new Date(Math.min(...timestamps.map(d => d.getTime())));

          // Optionally cache the result
          if (this.opts.cache) {
            await this.opts.cache.set(cacheKey, { timestamp: earliest.toISOString() }, 86400);
          }

          return this.createResponse(index, earliest, 0.6, timestamps.length);
        }
      } catch {
        continue;
      }
    }

    return this.createResponse('negative', null, -0.5, undefined, 'No valid results from Common Crawl indexes');
  }

  private constructUrl(domain: string, index: string): string {
    const query = `https://index.commoncrawl.org/${index}?url=${encodeURIComponent(domain)}&output=json`;
    return this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(query)}` : query;
  }

  private async extractTimestamps(res: Response): Promise<Date[]> {
    const lines = (await res.text()).split('\n').filter(Boolean);
    return lines.map(line => {
      try {
        const json = JSON.parse(line);
        const ts = json.timestamp;
        if (/^\d{14}$/.test(ts)) {
          return new Date(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`);
        }
      } catch {}
      return null;
    }).filter((date): date is Date => date instanceof Date && !isNaN(date.getTime()));
  }

  private createResponse(source: string, date: Date | null, weight: number, capturesFound?: number, error?: string): SignalResult {
    return {
      source: 'commoncrawl',
      date: date || undefined,
      trustLevel: source === 'cache' ? 'observed' : source === 'negative' ? 'negative' : 'observed',
      weight,
      metadata: capturesFound !== undefined ? { indexUsed: source, capturesFound } : { source },
      error: error || undefined,
    };
  }
}