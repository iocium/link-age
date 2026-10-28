import { RevocationEstimator } from '../../src/estimators/revocation';

const baseOpts = (secrets: any = { certspotterApiKey: 'key' }) => ({
  providerSecrets: secrets,
  timeoutMs: 8000,
} as any);

describe('RevocationEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should error if no API key', () => {
    expect(() => new RevocationEstimator({ providerSecrets: {} } as any)).toThrow();
  });

  it('returns metadata when no revoked certs', async () => {
    const est = new RevocationEstimator(baseOpts());
    global.fetch = async () => ({
      ok: true,
      json: async () => [
        { revocation: null },
        { revocation: { revoked: false } },
      ],
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.error).toBeUndefined();
    expect(result.metadata?.revokedCertCount).toBe(0);
  });

  it('returns error on non-ok response', async () => {
    const est = new RevocationEstimator(baseOpts());
    global.fetch = async () => ({ ok: false, status: 500 }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.error).toContain('500');
  });

  it('returns latest revocation date and reasons', async () => {
    const est = new RevocationEstimator(baseOpts());
    global.fetch = async () => ({
      ok: true,
      json: async () => [
        { revocation: { revoked: true, revocation_time: '2023-01-05T00:00:00Z', revocation_reason: 'keyCompromise' } },
        { revocation: { revoked: true, revocation_time: '2023-01-10T00:00:00Z', revocation_reason: 'cessationOfOperation' } },
      ],
    }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.date?.toISOString()).toBe('2023-01-10T00:00:00.000Z');
    expect(result.metadata?.revokedCertCount).toBe(2);
    expect(result.metadata?.reasons).toContain('keyCompromise');
  });

  it('returns error message on network failure', async () => {
    const est = new RevocationEstimator(baseOpts());
    global.fetch = async () => { throw new Error('net fail'); };
    const result = await est.estimate('https://example.com');
    expect(result.error).toBe('net fail');
  });
});
