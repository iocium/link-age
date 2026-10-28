import { SafeBrowsingEstimator } from '../../src/estimators/safebrowsing';

describe('SafeBrowsingEstimator', () => {
  afterEach(() => {
    global.fetch = (() => { throw new Error('unexpected fetch'); }) as any;
  });

  it('should throw on clean result', async () => {
    const est = new SafeBrowsingEstimator({});
    global.fetch = async () => ({ text: async () => 'clean' }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });

  it('returns current date when flagged', async () => {
    const est = new SafeBrowsingEstimator({ userAgent: 'ua' });
    global.fetch = async () => ({ text: async () => 'dangerous phishing site' }) as any;
    const result = await est.estimate('https://example.com');
    expect(result.trustLevel).toBe('inferred');
    expect(result.weight).toBe(0.5);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('uses corsProxy', async () => {
    const est = new SafeBrowsingEstimator({ userAgent: 'ua', corsProxy: 'https://proxy/?url=' });
    let url: string | undefined;
    global.fetch = async (u: any) => { url = u; return { text: async () => 'clean' } as any; };
    await expect(est.estimate('https://example.com')).rejects.toThrow();
    expect(url).toContain('https://proxy/?url=');
  });
});
