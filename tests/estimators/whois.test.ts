import { WhoisEstimator } from '../../src/estimators/whois';

describe('WhoisEstimator', () => {
  it('should throw on missing registration date', async () => {
    const est = new WhoisEstimator({});
    global.fetch = async () => ({ ok: true, json: async () => ({ events: [] }) }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});