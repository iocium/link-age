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
      cache?: { get: (key: string) => Promise<any>; set: (key: string, val: any, ttl: number) => Promise<void> };
    }
  ) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const cacheKey = `commoncrawl:${domain}`;
    const headers = { 'User-Agent': this.opts.userAgent };

    // Check cache first
    if (this.opts.cache) {
      const cached = await this.opts.cache.get(cacheKey);
      if (cached) {
        return {
          source: 'commoncrawl',
          date: new Date(cached.timestamp),
          trustLevel: 'observed',
          weight: 0.6,
          metadata: { source: 'cache' },
        };
      }
    }

    for (const index of INDEXES) {
      const query = `https://index.commoncrawl.org/${index}?url=${encodeURIComponent(domain)}&output=json`;
      const url = this.opts.corsProxy
        ? this.opts.corsProxy + encodeURIComponent(query)
        : query;

      try {
        const res = await fetch(url, { headers });
        if (!res.ok) continue;

        const lines = (await res.text()).split('\n').filter(Boolean);
        const timestamps = lines
          .map(line => {
            try {
              const json = JSON.parse(line);
              return json.timestamp;
            } catch {
              return null;
            }
          })
          .filter(ts => ts && /^\d{14}$/.test(ts))
          .map(ts => new Date(`${ts!.slice(0, 4)}-${ts!.slice(4, 6)}-${ts!.slice(6, 8)}`))
          .filter(date => !isNaN(date.getTime()));

        if (timestamps.length) {
          const earliest = new Date(Math.min(...timestamps.map(d => d.getTime())));

          // Optionally cache the result
          if (this.opts.cache) {
            await this.opts.cache.set(cacheKey, { timestamp: earliest.toISOString() }, 86400);
          }

          return {
            source: 'commoncrawl',
            date: earliest,
            trustLevel: 'observed',
            weight: 0.6,
            metadata: {
              indexUsed: index,
              capturesFound: timestamps.length,
            },
          };
        }
      } catch (_) {
        continue;
      }
    }

    return {
      source: 'commoncrawl',
      trustLevel: 'negative',
      weight: -0.5,
      error: 'No valid results from Common Crawl indexes',
    };
  }
}