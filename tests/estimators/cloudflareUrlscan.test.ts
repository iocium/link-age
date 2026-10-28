import { CloudflareUrlscanEstimator } from '../../src/estimators/cloudflareUrlscan';

const baseOpts = (overrides: any = {}) => ({
  providerSecrets: { cloudflareAccountId: 'acct', cloudflareApiKey: 'key' },
  ...overrides,
});

describe('CloudflareUrlscanEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('returns error when account id is missing', async () => {
    const est = new CloudflareUrlscanEstimator(baseOpts({ providerSecrets: { cloudflareApiKey: 'key' } }));
    const result = await est.estimate('https://example.com');
    expect(result.error).toBe('Missing Cloudflare Account ID');
  });

  it('returns error when api key is missing', async () => {
    const est = new CloudflareUrlscanEstimator(baseOpts({ providerSecrets: { cloudflareAccountId: 'acct' } }));
    const result = await est.estimate('https://example.com');
    expect(result.error).toBe('Missing Cloudflare API key');
  });

  it('returns earliest timestamp from results', async () => {
    const est = new CloudflareUrlscanEstimator(baseOpts());
    global.fetch = async () => ({
      json: async () => ({
        results: [
          { task: { time: '2023-01-10T00:00:00Z' } },
          { task: { time: '2023-01-05T00:00:00Z' } },
          { task: { time: '2023-01-15T00:00:00Z' } },
        ],
      }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.error).toBeUndefined();
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.trustLevel).toBe('observed');
    expect(result.weight).toBe(0.7);
  });

  it('filters invalid timestamps and returns error if none remain', async () => {
    const est = new CloudflareUrlscanEstimator(baseOpts());
    global.fetch = async () => ({
      json: async () => ({ results: [{ task: {} }, { task: { time: 'not-a-date' } }] }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.error).toContain('No historical Cloudflare data found');
  });

  it('returns error on network failure', async () => {
    const est = new CloudflareUrlscanEstimator(baseOpts());
    global.fetch = async () => { throw new Error('network down'); };
    const result = await est.estimate('https://example.com');
    expect(result.error).toBe('network down');
  });

  it('uses corsProxy and userAgent when provided', async () => {
    let calledUrl: string | undefined;
    let headers: any;
    const est = new CloudflareUrlscanEstimator(baseOpts({ corsProxy: 'https://proxy/?url=', userAgent: 'agent/1' }));
    global.fetch = async (url: any, init: any) => {
      calledUrl = url;
      headers = init.headers;
      return { json: async () => ({ results: [{ task: { time: '2023-01-05T00:00:00Z' } }] }) } as any;
    };
    await est.estimate('https://example.com');
    expect(calledUrl).toContain('https://proxy/?url=');
    expect(headers['User-Agent']).toBe('agent/1');
  });
});
