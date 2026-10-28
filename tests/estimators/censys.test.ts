import { CensysEstimator } from '../../src/estimators/censys';

const baseOpts = (overrides: any = {}) => ({
  providerSecrets: { censysApiId: 'id', censysApiSecret: 'secret' },
  ...overrides,
});

describe('CensysEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should throw without credentials', async () => {
    const est = new CensysEstimator({ providerSecrets: {} });
    await expect(est.estimate('https://example.com')).rejects.toThrow('Censys API credentials missing');
  });

  it('returns observed result on success', async () => {
    const est = new CensysEstimator(baseOpts());
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ result: { hits: [{ first_seen: '2023-01-05T00:00:00Z' }] } }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.trustLevel).toBe('observed');
  });

  it('sends user-agent when provided', async () => {
    const est = new CensysEstimator(baseOpts({ userAgent: 'agent/1' }));
    let headers: any;
    global.fetch = async (_url: any, init: any) => {
      headers = init.headers;
      return { ok: true, json: async () => ({ result: { hits: [{ first_seen: '2023-01-05T00:00:00Z' }] } }) } as any;
    };
    await est.estimate('https://example.com');
    expect(headers['User-Agent']).toBe('agent/1');
  });

  it('uses corsProxy when provided', async () => {
    const est = new CensysEstimator(baseOpts({ corsProxy: 'https://proxy/?url=' }));
    let url: string | undefined;
    global.fetch = async (u: any) => {
      url = u;
      return { ok: true, json: async () => ({ result: { hits: [{ first_seen: '2023-01-05T00:00:00Z' }] } }) } as any;
    };
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
  });

  it('throws when API returns non-ok', async () => {
    const est = new CensysEstimator(baseOpts());
    global.fetch = async () => ({ ok: false, status: 403 }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('403');
  });

  it('throws when first_seen is missing', async () => {
    const est = new CensysEstimator(baseOpts());
    global.fetch = async () => ({ ok: true, json: async () => ({ result: { hits: [{}] } }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('no first_seen');
  });
});
