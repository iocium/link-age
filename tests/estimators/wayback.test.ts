import { WaybackEstimator } from '../../src/estimators/wayback';

describe('WaybackEstimator', () => {
  it('should throw if archive is missing', async () => {
    const est = new WaybackEstimator({});
    global.fetch = async () => ({ ok: true, json: async () => [] }) as any;
    await expect(est.estimate('https://example.com')).rejects.toThrow();
  });
});