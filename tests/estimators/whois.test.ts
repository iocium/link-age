import { WhoisEstimator } from '../../src/estimators/whois';

describe('WhoisEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should return negative on 404', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({ status: 404, ok: false }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.trustLevel).toBe('negative');
    expect(result.weight).toBe(-1.0);
    expect(result.error).toContain('not found');
  });

  it('should throw on non-ok status', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({ status: 500, ok: false }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('WHOIS fetch failed');
  });

  it('should return authoritative when registered and not held', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        events: [{ eventAction: 'registration', eventDate: '2023-01-05T00:00:00Z' }],
        status: ['active'],
      }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.trustLevel).toBe('authoritative');
    expect(result.weight).toBe(1.0);
    expect(result.date?.toISOString()).toBe('2023-01-05T00:00:00.000Z');
    expect(result.metadata).toBeUndefined();
  });

  it('should return negative when status contains hold', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        events: [{ eventAction: 'registration', eventDate: '2023-01-05T00:00:00Z' }],
        status: ['server hold'],
      }),
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.trustLevel).toBe('negative');
    expect(result.weight).toBe(-0.8);
    expect(result.metadata?.statusFlags).toContain('server hold');
  });

  it('should throw on missing registration date', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({ ok: true, json: async () => ({ events: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('uses cors proxy when provided', async () => {
    const est = new WhoisEstimator({ corsProxy: 'https://proxy/?url=', userAgent: 'ua' });
    let url: string | undefined;
    let headers: any;
    global.fetch = async (u: any, init: any) => {
      url = u;
      headers = init.headers;
      return {
        ok: true,
        json: async () => ({
          events: [{ eventAction: 'registration', eventDate: '2023-01-05T00:00:00Z' }],
          status: [],
        }),
      } as any;
    };
    const result = await est.estimate('https://example.com');
    expect(url).toContain('https://proxy/?url=');
    expect(headers['User-Agent']).toBe('ua');
    expect(result.trustLevel).toBe('authoritative');
  });
});
