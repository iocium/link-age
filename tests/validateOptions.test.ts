import { validateOptions } from '../src/validateOptions';

describe('validateOptions', () => {
  it('applies defaults when given empty options', () => {
    const opts = validateOptions({});
    expect(opts.enableWhois).toBe(true);
    expect(opts.enableCt).toBe(true);
    expect(opts.enableWayback).toBe(true);
    expect(opts.enableSafeBrowsing).toBe(false);
    expect(opts.timeoutMs).toBe(8000);
    expect(opts.concurrencyLimit).toBe(3);
    expect(opts.stopOnConfidence).toEqual({ minSignals: 2, withinDays: 5 });
  });

  it('respects explicitly provided values', () => {
    const opts = validateOptions({ enableWhois: false, timeoutMs: 5000, concurrencyLimit: 10 });
    expect(opts.enableWhois).toBe(false);
    expect(opts.timeoutMs).toBe(5000);
    expect(opts.concurrencyLimit).toBe(10);
  });

  it('provides a callable default logHandler', () => {
    const opts = validateOptions({});
    expect(() => opts.logHandler('test')).not.toThrow();
  });
});
