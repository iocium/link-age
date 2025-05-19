import { CTEstimator } from '../../src/estimators/ct';

describe('CTEstimator', () => {
  it('should fail gracefully if no CT data available', async () => {
    const est = new CTEstimator({});
    global.fetch = async () => ({ ok: true, json: async () => [] }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow('CT logs returned no valid certificate dates');
  });
});