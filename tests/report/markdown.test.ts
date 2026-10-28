import { generateMarkdownReport } from '../../src/report/markdown';

const baseResult: any = {
  humanReadable: 'summary text',
  signals: [
    { source: 'whois', date: new Date('2023-01-01'), trustLevel: 'authoritative', weight: 1 },
    { source: 'dns', error: 'no data' },
  ],
};

describe('generateMarkdownReport', () => {
  it('renders header and summary', () => {
    const md = generateMarkdownReport(baseResult, 'https://example.com');
    expect(md).toContain('# Link-Age Report for https://example.com');
    expect(md).toContain('summary text');
  });

  it('renders signal rows', () => {
    const md = generateMarkdownReport(baseResult, 'https://example.com');
    expect(md).toContain('| whois |');
    expect(md).toContain('ERROR: no data');
  });

  it('renders fixed weight to two decimals', () => {
    const md = generateMarkdownReport(baseResult, 'https://example.com');
    expect(md).toContain('1.00');
  });
});
