import { execSync } from 'child_process';

describe('CLI output', () => {
  it('should display summary output for example.com', () => {
    const runtime = process.execPath;
    const result = execSync(`${runtime} dist/cli.js https://example.com --no-wayback --no-ct --no-safebrowsing --json`, { encoding: 'utf8' });
    expect(result).toMatch(/example/i);
  });
});