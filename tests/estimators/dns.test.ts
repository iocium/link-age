import { DnsEstimator } from '../../src/estimators/dns';

describe('DnsEstimator', () => {
  it('should throw if no provider secrets are given', async () => {
    const est = new DnsEstimator({ providerSecrets: {} });
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});