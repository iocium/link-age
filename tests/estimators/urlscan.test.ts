import { UrlscanEstimator } from '../../src/estimators/urlscan';

describe('UrlscanEstimator', () => {
  it('should throw if no results', async () => {
    const est = new UrlscanEstimator({ providerSecrets: { urlscanApiKey: 'test' } });
    global.fetch = async () => ({ json: async () => ({ results: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});