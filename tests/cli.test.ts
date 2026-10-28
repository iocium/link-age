import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';

const runtime = process.execPath;
const run = (args: string) => execSync(`${runtime} dist/cli.js ${args}`, { encoding: 'utf8' });

describe('CLI output', () => {
  it('should display summary output for example.com', () => {
    const result = run('https://example.com --no-wayback --no-ct --no-safebrowsing --json');
    expect(result).toMatch(/example/i);
  });

  it('outputs JSON with --json', () => {
    const result = run('https://example.com --no-whois --no-ct --no-wayback --no-safebrowsing --json');
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.input).toBe('https://example.com');
    expect(parsed.confidence).toBe('none');
  });

  it('outputs HTML with --html', () => {
    const result = run('https://example.com --no-whois --no-ct --no-wayback --no-safebrowsing --html');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Domain/URL Age Estimation Report');
  });

  it('outputs Markdown with --markdown', () => {
    const result = run('https://example.com --no-whois --no-ct --no-wayback --no-safebrowsing --markdown');
    expect(result).toContain('# Link-Age Report');
  });

  it('writes to file with --out', () => {
    const out = '/tmp/link-age-test-out.json';
    if (existsSync(out)) unlinkSync(out);
    run(`https://example.com --no-whois --no-ct --no-wayback --no-safebrowsing --json --out ${out}`);
    expect(existsSync(out)).toBe(true);
    const content = readFileSync(out, 'utf8');
    expect(JSON.parse(content).input).toBe('https://example.com');
    unlinkSync(out);
  });
});
