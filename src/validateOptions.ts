import type { LinkAgeOptions } from './utils';

export function validateOptions(opts: LinkAgeOptions): Required<LinkAgeOptions> {
  const defaultUserAgent = 'iocium/link-age v1.2.0 (https://github.com/iocium/link-age)';

  return {
    enableWhois: opts.enableWhois ?? true,
    enableCt: opts.enableCt ?? true,
    enableDns: opts.enableDns ?? false,
    enableWayback: opts.enableWayback ?? true,
    enableUrlscan: opts.enableUrlscan ?? false,
    enableShodan: opts.enableShodan ?? false,
    enableRevocation: opts.enableRevocation ?? false,
    enableRadar: opts.enableRadar ?? false,
    enableCensys: opts.enableCensys ?? false,
    enableSafeBrowsing: opts.enableSafeBrowsing ?? true,
    timeoutMs: opts.timeoutMs ?? 8000,
    concurrencyLimit: opts.concurrencyLimit ?? 3,
    stopOnConfidence: opts.stopOnConfidence ?? { minSignals: 2, withinDays: 5 },
    userAgent: opts.userAgent || defaultUserAgent,
    providerSecrets: opts.providerSecrets || {},
    logHandler: opts.logHandler || (() => {}),
    input: opts.input || '',
    corsProxy: opts.corsProxy || ''
  };
}