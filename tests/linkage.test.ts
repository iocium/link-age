import { LinkAgeEstimator } from '../src/index';

describe('LinkAgeEstimator', () => {
  it('should produce a confidence score and signal list', async () => {
    const estimator = new LinkAgeEstimator({ enableCt: false, enableWhois: false, enableWayback: false });
    const result = await estimator.estimate('https://example.com');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('confidence');
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('should reject an invalid URL', async () => {
    const estimator = new LinkAgeEstimator({ enableCt: false, enableWhois: false, enableWayback: false });
    await expect(estimator.estimate('https://urlscan.io]')).rejects.toThrow('Invalid URL');
  });

  it('includes plugin signals', async () => {
    const plugin = {
      source: 'mock',
      estimate: async () => ({ source: 'mock', date: new Date('2022-01-01'), trustLevel: 'observed' as const }),
    };
    const estimator = new LinkAgeEstimator({ plugins: [plugin], enableWhois: false, enableCt: false, enableWayback: false });
    const result = await estimator.estimate('https://example.com');
    expect(result.signals).toEqual(expect.arrayContaining([expect.objectContaining({ source: 'mock' })]));
  });

  it('calls plugin setup when provided', async () => {
    let called = false;
    const plugin = {
      source: 'mock',
      setup: () => { called = true; },
      estimate: async () => ({ source: 'mock', date: new Date(), trustLevel: 'observed' as const }),
    };
    const estimator = new LinkAgeEstimator({ plugins: [plugin], enableWhois: false, enableCt: false, enableWayback: false });
    await estimator.estimate('https://example.com');
    expect(called).toBe(true);
  });

  it('runs safebrowsing when explicitly enabled', async () => {
    const estimator = new LinkAgeEstimator({ enableWhois: false, enableCt: false, enableWayback: false, enableSafeBrowsing: true });
    global.fetch = async () => ({ text: async () => 'dangerous phishing' }) as any;
    const result = await estimator.estimate('https://example.com');
    expect(result.signals.some(s => s.source === 'safebrowsing' && s.date)).toBe(true);
  });
});