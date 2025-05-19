import { CensysEstimator } from '../../src/estimators/censys';

describe('CensysEstimator', () => {
  it('should throw without credentials', async () => {
    const est = new CensysEstimator({ providerSecrets: {} });
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});