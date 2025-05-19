import { RevocationEstimator } from '../../src/estimators/revocation';

describe('RevocationEstimator', () => {
  it('should error if no API key', () => {
    expect(() => new RevocationEstimator({ providerSecrets: {} } as any)).toThrow();
  });
});