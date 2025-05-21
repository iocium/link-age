import { execSync } from 'child_process';

describe('CLI output', () => {
  it('should display summary output for example.com', () => {
    const result = execSync('node dist/cli.js https://example.com --no-wayback --no-ct --no-safebrowsing --json', { encoding: 'utf8' });
    expect(result).toMatch(/example/i);
  });
});