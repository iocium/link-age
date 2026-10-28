import { CommonCrawlEstimator } from '../../src/estimators/commoncrawl';

const baseOpts = (overrides: any = {}) => ({
  userAgent: 'test-agent',
  ...overrides,
});

const makeCache = () => {
  const store: any = {};
  return {
    get: async (key: string) => store[key] || null,
    set: async (key: string, val: any) => { store[key] = val; },
  };
};

describe('CommonCrawlEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('returns cached result on cache hit', async () => {
    const cache = makeCache();
    await cache.set('commoncrawl:example.com', { timestamp: '2023-01-05T00:00:00.000Z' });
    const est = new CommonCrawlEstimator({ ...baseOpts(), cache: cache as any });
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.trustLevel).toBe('observed');
  });

  it('fetches earliest timestamp across indexes and caches it', async () => {
    const cache = makeCache();
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        ok: true,
        text: async () => [
          '{"timestamp":"20230110000000","url":"http://example.com/"}',
          '{"timestamp":"20230105000000","url":"http://example.com/"}',
          '{"timestamp":"bad"}',
        ].join('\n'),
      } as any;
    };
    const est = new CommonCrawlEstimator({ ...baseOpts(), cache: cache as any });
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.weight).toBe(0.6);
    expect(result.metadata).toEqual({ indexUsed: expect.stringContaining('CC-MAIN'), capturesFound: 2 });
    const cached = await cache.get('commoncrawl:example.com');
    expect(cached.timestamp).toBe('2023-01-05T00:00:00.000Z');
    expect(callCount).toBe(1);
  });

  it('falls through indexes when response is not ok', async () => {
    let calls = 0;
    global.fetch = async () => {
      calls++;
      return { ok: false, text: async () => '' } as any;
    };
    const est = new CommonCrawlEstimator(baseOpts());
    const result = await est.estimate('https://example.com');
    expect(result.error).toContain('No valid results from Common Crawl');
    expect(calls).toBe(3);
  });

  it('returns negative when all indexes have no valid timestamps', async () => {
    global.fetch = async () => ({ ok: true, text: async () => '{"timestamp":"bad"}\n' }) as any;
    const est = new CommonCrawlEstimator(baseOpts());
    const result = await est.estimate('https://example.com');
    expect(result.error).toContain('No valid results from Common Crawl');
  });

  it('uses corsProxy', async () => {
    let url: string | undefined;
    global.fetch = async (u: any) => {
      url = u;
      return { ok: true, text: async () => '{"timestamp":"20230105000000"}\n' } as any;
    };
    const est = new CommonCrawlEstimator({ ...baseOpts(), corsProxy: 'https://proxy/?url=' });
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
  });
});
