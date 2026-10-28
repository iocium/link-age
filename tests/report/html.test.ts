import { generateHtmlReport } from '../../src/report/html';

const baseResult: any = {
  humanReadable: 'summary text',
  signals: [
    { source: 'whois', date: new Date('2023-01-01'), trustLevel: 'authoritative', weight: 1 },
    { source: 'ct', date: new Date('2023-01-10'), trustLevel: 'observed', weight: 0.75 },
    { source: 'dns', error: 'no data' },
  ],
};

describe('generateHtmlReport', () => {
  it('includes input and summary', () => {
    const html = generateHtmlReport(baseResult, 'https://example.com');
    expect(html).toContain('https://example.com');
    expect(html).toContain('summary text');
  });

  it('renders signal rows', () => {
    const html = generateHtmlReport(baseResult, 'https://example.com');
    expect(html).toContain('<td>whois</td>');
    expect(html).toContain('<td>ct</td>');
    expect(html).toContain('ERROR: no data');
  });

  it('renders timeline markers', () => {
    const html = generateHtmlReport(baseResult, 'https://example.com');
    expect(html).toContain('class="marker"');
  });
});
