import { CTEstimator } from '../../src/estimators/ct';

describe('CTEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should fail gracefully if no CT data available', async () => {
    const est = new CTEstimator({});
    global.fetch = async () => ({ ok: true, json: async () => [] }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('CT logs returned no valid certificate dates');
  });

  it('throws on non-ok response', async () => {
    const est = new CTEstimator({});
    global.fetch = async () => ({ ok: false, status: 500 }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('500');
  });

  it('deduplicates identical certificate dates', async () => {
    const est = new CTEstimator({});
    global.fetch = async () => ({
      ok: true,
      json: async () => [
        { not_before: '2023-01-05T00:00:00Z' },
        { not_before: '2023-01-05T00:00:00Z' },
      ],
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.trustLevel).toBe('observed');
  });

  it('uses corsProxy', async () => {
    const est = new CTEstimator({ corsProxy: 'https://proxy/?url=' });
    let url: string | undefined;
    global.fetch = async (u: any) => {
      url = u;
      return { ok: true, json: async () => [{ not_before: '2023-01-05T00:00:00Z' }] } as any;
    };
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
  });

  it('sends Cert Spotter API key when provided', async () => {
    const est = new CTEstimator({ providerSecrets: { certspotterApiKey: 'secret' }, userAgent: 'ua' });
    let headers: any;
    global.fetch = async (_url: any, init: any) => {
      headers = init.headers;
      return { ok: true, json: async () => [{ not_before: '2023-01-05T00:00:00Z' }] } as any;
    };
    await est.estimate('https://example.com');
    expect(headers.Authorization).toBe('Bearer secret');
  });

  it('works without a Cert Spotter API key', async () => {
    const est = new CTEstimator({ userAgent: 'ua' });
    let headers: any;
    global.fetch = async (_url: any, init: any) => {
      headers = init.headers;
      return { ok: true, json: async () => [{ not_before: '2023-01-05T00:00:00Z' }] } as any;
    };
    await est.estimate('https://example.com');
    expect(headers.Authorization).toBeUndefined();
  });
});
