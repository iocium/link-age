import type { LinkAgeOptions, LinkAgePlugin } from './utils';

/**
 * Validates and normalizes the provided options for the link age functionality.
 *
 * This function takes an object of type `LinkAgeOptions` and returns a new object 
 * with all required properties, applying default values where necessary. 
 * The returned object ensures that all options are set to a valid state before 
 * being used in the application.
 *
 * @param opts - The options to validate, which should conform to the `LinkAgeOptions` type.
 * @returns Required<LinkAgeOptions> - An object containing all required options with defaults applied.
 *
 * @example
 * const options = validateOptions({ enableWhois: false });
 * // options will have all properties set, with enableWhois set to false and defaults for others.
 */
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
    enableCloudflareUrlscan: opts.enableCloudflareUrlscan ?? false,
    enableCensys: opts.enableCensys ?? false,
    enableSafeBrowsing: opts.enableSafeBrowsing ?? true,
    enableCommonCrawl: opts.enableCommonCrawl ?? false,
    timeoutMs: opts.timeoutMs ?? 8000,
    concurrencyLimit: opts.concurrencyLimit ?? 3,
    stopOnConfidence: opts.stopOnConfidence ?? { minSignals: 2, withinDays: 5 },
    userAgent: opts.userAgent || defaultUserAgent,
    providerSecrets: opts.providerSecrets || {},
    logHandler: opts.logHandler || (() => {}),
    input: opts.input || '',
    corsProxy: opts.corsProxy || '',
    plugins: []
  };
}