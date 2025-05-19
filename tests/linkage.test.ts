import { LinkAgeEstimator } from '../src/index';

describe('LinkAgeEstimator', () => {
  it('should produce a confidence score and signal list', async () => {
    const estimator = new LinkAgeEstimator({ enableCt: false, enableWhois: false, enableWayback: false });
    const result = await estimator.estimate('https://example.com');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('confidence');
    expect(Array.isArray(result.signals)).toBe(true);
  });
});