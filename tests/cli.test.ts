import { execSync } from 'child_process';

describe('CLI output', () => {
  it('should display summary output for example.com', () => {
    const result = execSync('node dist/cli.js https://example.com --no-whois --no-ct --no-wayback --no-radar --no-safebrowsing --json', { encoding: 'utf8' });
    expect(result).toMatch(/example/i);
  });
});