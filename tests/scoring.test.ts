import { scoreSignals, getConfidence } from '../src/scoring';
import { validateOptions } from '../src/validateOptions';

const defaults = validateOptions({});

describe('scoreSignals', () => {
  it('returns zero score when no valid signals', () => {
    expect(scoreSignals([], defaults)).toEqual({ score: 0, earliest: undefined });
  });

  it('finds earliest date and sums weights', () => {
    const result = scoreSignals([
      { source: 'whois', date: new Date('2023-01-10'), trustLevel: 'authoritative', weight: 1.0 },
      { source: 'ct', date: new Date('2023-01-20'), trustLevel: 'observed', weight: 0.75 },
    ], defaults);
    expect(result.earliest?.toISOString()).toBe('2023-01-10T00:00:00.000Z');
    expect(result.score).toBeCloseTo(1.0 * 1.5 * 1.5 + 0.75 * 1.0 * 1.0, 5);
  });

  it('applies proximity bonus within withinDays', () => {
    const result = scoreSignals([
      { source: 'whois', date: new Date('2023-01-10'), trustLevel: 'authoritative' },
      { source: 'ct', date: new Date('2023-01-11'), trustLevel: 'observed' },
    ], defaults);
    const expected = 1.5 * 1.5 + 1.0 * 1.5;
    expect(result.score).toBeCloseTo(expected, 5);
  });

  it('skips signals with errors or missing dates', () => {
    const result = scoreSignals([
      { source: 'whois', date: new Date('2023-01-10'), trustLevel: 'authoritative' },
      { source: 'dns', error: 'boom' },
      { source: 'ct' },
    ], defaults);
    expect(result.score).toBeCloseTo(1.0 * 1.5 * 1.5, 5);
  });

  it('applies inferred trust multiplier', () => {
    const result = scoreSignals([
      { source: 'safebrowsing', date: new Date('2023-01-10'), trustLevel: 'inferred', weight: 1.0 },
    ], defaults);
    expect(result.score).toBeCloseTo(1.0 * 0.75 * 1.5, 5);
  });
});

describe('getConfidence', () => {
  it('returns none for no valid signals', () => {
    expect(getConfidence([], defaults)).toBe('none');
  });

  it('returns low when below minSignals', () => {
    expect(getConfidence([{ source: 'whois', date: new Date() }], defaults)).toBe('low');
  });

  it('returns medium when enough signals but too spread out', () => {
    expect(getConfidence([
      { source: 'a', date: new Date('2023-01-01') },
      { source: 'b', date: new Date('2023-01-30') },
    ], defaults)).toBe('medium');
  });

  it('returns high when enough signals close together', () => {
    expect(getConfidence([
      { source: 'a', date: new Date('2023-01-01') },
      { source: 'b', date: new Date('2023-01-02') },
      { source: 'c', date: new Date('2023-01-03') },
    ], defaults)).toBe('high');
  });
});
