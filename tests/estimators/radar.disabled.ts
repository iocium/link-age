import { RadarEstimator } from '../../src/estimators/radar';

describe('RadarEstimator', () => {
  it('should throw without credentials', async () => {
    const est = new RadarEstimator({ providerSecrets: {} });
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
  it('should throw if no firstSeen is available', async () => {
    const est = new RadarEstimator({});
    global.fetch = async () => ({ json: async () => ({ data: { domainRank: null } }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});