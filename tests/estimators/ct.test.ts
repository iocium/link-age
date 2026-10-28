import { CTEstimator } from '../../src/estimators/ct';

const crtShUrl = 'https://crt.sh';
const certspotterUrl = 'https://api.certspotter.com/v1/issuances';

const makeResponse = (entries: any[], link?: string, ok = true) => ({
  ok,
  json: async () => entries,
  headers: {
    get: (name: string) => (name.toLowerCase() === 'link' ? link || null : null),
  },
});

describe('CTEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('returns earliest date from crt.sh', async () => {
    const est = new CTEstimator({});
    global.fetch = async (url: any) => {
      if (String(url).includes('crt.sh')) {
        return makeResponse([
          { not_before: '2023-01-10T00:00:00Z' },
          { not_before: '2023-01-05T00:00:00Z' },
        ]);
      }
      throw new Error('should not reach Cert Spotter');
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
  });

  it('falls back to Cert Spotter when crt.sh is unavailable', async () => {
    const est = new CTEstimator({});
    global.fetch = async (url: any) => {
      if (String(url).includes('crt.sh')) {
        return { ok: false, status: 502, json: async () => ({}), headers: { get: () => null } };
      }
      if (String(url).includes('certspotter')) {
        return makeResponse([{ not_before: '2023-01-05T00:00:00Z' }]);
      }
      throw new Error('unexpected');
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
  });

  it('falls back to Cert Spotter when crt.sh returns no valid dates', async () => {
    const est = new CTEstimator({});
    global.fetch = async (url: any) => {
      if (String(url).includes('crt.sh')) {
        return makeResponse([]);
      }
      return makeResponse([{ not_before: '2023-02-01T00:00:00Z' }]);
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-02-01T00:00:00.000Z');
  });

  it('paginates through Cert Spotter pages until there is no next link', async () => {
    const est = new CTEstimator({});
    let calls = 0;
    const urls: string[] = [];
    global.fetch = async (url: any) => {
      const u = String(url);
      urls.push(u);
      if (u.includes('crt.sh')) return makeResponse([]);
      calls++;
      const link = calls < 3
        ? '<https://api.certspotter.com/issuances?after=100&domain=example.com>; rel="next"'
        : undefined;
      return makeResponse([{ not_before: `2020-01-0${calls}T00:00:00Z` }], link);
    };
    const result = await est.estimate('https://example.com');
    expect(calls).toBe(3);
    expect(result.date?.toISOString()).toBe('2020-01-01T00:00:00.000Z');
    // Cert Spotter's Link header omits /v1; ensure we rewrite it.
    expect(urls.some(u => u.includes('/v1/issuances') && u.includes('after=100'))).toBe(true);
  });

  it('stops paginating after the configured maximum', async () => {
    const est = new CTEstimator({});
    let calls = 0;
    global.fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('crt.sh')) return makeResponse([]);
      calls++;
      return makeResponse(
        [{ not_before: `2020-01-${calls.toString().padStart(2, '0')}T00:00:00Z` }],
        '<https://api.certspotter.com/v1/issuances?after=100&domain=example.com>; rel="next"'
      );
    };
    const result = await est.estimate('https://example.com');
    expect(calls).toBe(10);
    expect(result.date?.toISOString()).toBe('2020-01-01T00:00:00.000Z');
  });

  it('sends Cert Spotter API key when provided', async () => {
    const est = new CTEstimator({ providerSecrets: { certspotterApiKey: 'secret' }, userAgent: 'ua' });
    let headers: any;
    global.fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('crt.sh')) return makeResponse([]);
      headers = init.headers;
      return makeResponse([{ not_before: '2023-01-05T00:00:00Z' }]);
    };
    await est.estimate('https://example.com');
    expect(headers.Authorization).toBe('Bearer secret');
  });

  it('works without a Cert Spotter API key', async () => {
    const est = new CTEstimator({ userAgent: 'ua' });
    let headers: any;
    global.fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('crt.sh')) return makeResponse([]);
      headers = init.headers;
      return makeResponse([{ not_before: '2023-01-05T00:00:00Z' }]);
    };
    await est.estimate('https://example.com');
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws when both crt.sh and Cert Spotter fail', async () => {
    const est = new CTEstimator({});
    global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}), headers: { get: () => null } }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('uses corsProxy for crt.sh', async () => {
    const est = new CTEstimator({ corsProxy: 'https://proxy/?url=' });
    let url: string | undefined;
    global.fetch = async (u: any) => {
      url = u;
      return makeResponse([{ not_before: '2023-01-05T00:00:00Z' }]);
    };
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
    expect(url).toContain('crt.sh');
  });

  it('uses corsProxy for Cert Spotter and subsequent pages', async () => {
    const est = new CTEstimator({ corsProxy: 'https://proxy/?url=' });
    let calls = 0;
    const urls: string[] = [];
    global.fetch = async (u: any) => {
      const us = String(u);
      urls.push(us);
      if (us.includes('crt.sh')) return makeResponse([]);
      calls++;
      return makeResponse(
        [{ not_before: '2023-01-05T00:00:00Z' }],
        calls === 1 ? '<https://api.certspotter.com/v1/issuances?after=100&domain=example.com>; rel="next"' : undefined
      );
    };
    await est.estimate('https://example.com');
    expect(urls[0]).toContain('https://proxy/?url=');
    expect(urls[1]).toContain('https://proxy/?url=');
  });
});
