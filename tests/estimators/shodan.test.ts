import { ShodanEstimator } from '../../src/estimators/shodan';

describe('ShodanEstimator', () => {
  it('should throw if no data found', async () => {
    const est = new ShodanEstimator({ providerSecrets: { shodanApiKey: 'test' } });
    global.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});