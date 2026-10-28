import { UrlscanEstimator } from '../../src/estimators/urlscan';

describe('UrlscanEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should throw if no results', async () => {
    const est = new UrlscanEstimator({ providerSecrets: { urlscanApiKey: 'test' } });
    global.fetch = async () => ({ json: async () => ({ results: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('returns earliest urlscan result', async () => {
    const est = new UrlscanEstimator({ providerSecrets: { urlscanApiKey: 'test' }, userAgent: 'ua' });
    global.fetch = async () => ({
      json: async () => ({
        results: [
          { task: { time: '2023-01-10T00:00:00Z' } },
          { task: { time: '2023-01-05T00:00:00Z' } },
        ],
      }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.trustLevel).toBe('observed');
  });

  it('uses corsProxy and userAgent', async () => {
    const est = new UrlscanEstimator({ providerSecrets: { urlscanApiKey: 'test' }, userAgent: 'ua', corsProxy: 'https://proxy/?url=' });
    let url: string | undefined;
    let headers: any;
    global.fetch = async (u: any, init: any) => {
      url = u;
      headers = init.headers;
      return { json: async () => ({ results: [{ task: { time: '2023-01-05T00:00:00Z' } }] }) } as any;
    };
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
    expect(headers['User-Agent']).toBe('ua');
  });
});
