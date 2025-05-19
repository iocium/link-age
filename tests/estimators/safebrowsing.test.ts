import { SafeBrowsingEstimator } from '../../src/estimators/safebrowsing';

describe('SafeBrowsingEstimator', () => {
  it('should throw on clean result', async () => {
    const est = new SafeBrowsingEstimator({});
    global.fetch = async () => ({ text: async () => 'clean' }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});