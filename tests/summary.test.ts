import { formatSummary } from '../src/summary';

const now = Date.now();

describe('formatSummary', () => {
  it('handles unknown age', () => {
    expect(formatSummary(undefined, 0, 'none')).toBe('Domain age unknown. No valid signals returned.');
  });

  it('formats <1 day', () => {
    const earliest = new Date(now - 12 * 60 * 60 * 1000);
    expect(formatSummary(earliest, 1.5, 'low')).toMatch(/new domain, <1 day old/);
  });

  it('formats days', () => {
    const earliest = new Date(now - 3 * 24 * 60 * 60 * 1000);
    expect(formatSummary(earliest, 1, 'low')).toMatch(/new domain, ~3 days old/);
  });

  it('formats weeks', () => {
    const earliest = new Date(now - 14 * 24 * 60 * 60 * 1000);
    expect(formatSummary(earliest, 1, 'low')).toMatch(/recent domain, ~2 weeks old/);
  });

  it('formats months', () => {
    const earliest = new Date(now - 60 * 24 * 60 * 60 * 1000);
    expect(formatSummary(earliest, 1, 'medium')).toMatch(/moderately old domain, ~2 months old/);
  });

  it('formats years', () => {
    const earliest = new Date(now - 400 * 24 * 60 * 60 * 1000);
    expect(formatSummary(earliest, 1, 'high')).toMatch(/established domain, ~1 years old/);
  });
});
