import { ShodanEstimator } from '../../src/estimators/shodan';

describe('ShodanEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should throw if no data found', async () => {
    const est = new ShodanEstimator({ providerSecrets: { shodanApiKey: 'test' } });
    global.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('returns earliest last_seen', async () => {
    const est = new ShodanEstimator({ providerSecrets: { shodanApiKey: 'test' }, userAgent: 'ua' });
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [
          { last_seen: '2023-01-10' },
          { last_seen: '2023-01-05' },
          { last_seen: 'invalid' },
        ],
      }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toContain('2023-01-05');
    expect(result.trustLevel).toBe('observed');
  });

  it('throws on non-ok response', async () => {
    const est = new ShodanEstimator({ providerSecrets: { shodanApiKey: 'test' } });
    global.fetch = async () => ({ ok: false, status: 401 }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('401');
  });

  it('uses corsProxy and userAgent', async () => {
    const est = new ShodanEstimator({ providerSecrets: { shodanApiKey: 'test' }, userAgent: 'ua', corsProxy: 'https://proxy/?url=' });
    let url: string | undefined;
    let headers: any;
    global.fetch = async (u: any, init: any) => {
      url = u;
      headers = init.headers;
      return { ok: true, json: async () => ({ data: [{ last_seen: '2023-01-05' }] }) } as any;
    };
    await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
    expect(headers['User-Agent']).toBe('ua');
  });
});
