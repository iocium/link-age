import { DnsEstimator } from '../../src/estimators/dns';

describe('DnsEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should throw if no provider secrets are given', async () => {
    const est = new DnsEstimator({ providerSecrets: {} });
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('queries SecurityTrails when key is provided', async () => {
    const est = new DnsEstimator({ providerSecrets: { securitytrailsApiKey: 'key' }, userAgent: 'ua' });
    global.fetch = async (url: any) => {
      expect(url).toContain('securitytrails.com');
      return { json: async () => ({ records: [{ first_seen: '2023-01-05' }] }) } as any;
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toContain('2023-01-05');
    expect(result.source).toBe('dns');
  });

  it('queries PassiveTotal when credentials are provided', async () => {
    const est = new DnsEstimator({ providerSecrets: { passiveTotalUsername: 'u', passiveTotalApiKey: 'p' }, userAgent: 'ua' });
    global.fetch = async (url: any) => {
      expect(url).toContain('passivetotal.org');
      return { json: async () => ({ results: [{ firstSeen: '2023-01-10' }] }) } as any;
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toContain('2023-01-10');
  });

  it('falls back to PassiveTotal when SecurityTrails returns empty', async () => {
    let calls = 0;
    const est = new DnsEstimator({
      providerSecrets: { securitytrailsApiKey: 'k', passiveTotalUsername: 'u', passiveTotalApiKey: 'p' },
      userAgent: 'ua',
      logHandler: () => {},
    });
    global.fetch = async (url: any) => {
      calls++;
      if (url.includes('securitytrails')) {
        return { json: async () => ({ records: [] }) } as any;
      }
      return { json: async () => ({ results: [{ firstSeen: '2023-01-08' }] }) } as any;
    };
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toContain('2023-01-08');
    expect(calls).toBe(2);
  });

  it('logs provider errors and throws when all fail', async () => {
    const logs: string[] = [];
    const est = new DnsEstimator({
      providerSecrets: { securitytrailsApiKey: 'k' },
      userAgent: 'ua',
      logHandler: (msg: string) => logs.push(msg),
    });
    global.fetch = async () => { throw new Error('boom'); };
    await expect(est.estimate('https://example.com')).rejects.toThrow();
    expect(logs.some(l => l.includes('boom'))).toBe(true);
  });
});
