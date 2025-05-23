import { validateOptions } from './validateOptions';
import type { LinkAgeOptions, LinkAgeResult, SignalResult } from './utils';
import { getConfidence, scoreSignals } from './scoring';
import { formatSummary } from './summary';

import { CTEstimator } from './estimators/ct';
import { WhoisEstimator } from './estimators/whois';
import { WaybackEstimator } from './estimators/wayback';
import { DnsEstimator } from './estimators/dns';
import { UrlscanEstimator } from './estimators/urlscan';
import { ShodanEstimator } from './estimators/shodan';
import { RevocationEstimator } from './estimators/revocation';
import { CloudflareUrlscanEstimator } from './estimators/cloudflareUrlscan';
import { CloudflareRadarEstimator } from './estimators/cloudflareRadar';
import { CommonCrawlEstimator } from './estimators/commoncrawl';
import { CensysEstimator } from './estimators/censys';
import { SafeBrowsingEstimator } from './estimators/safebrowsing';

/**
 * Class representing a Link Age Estimator.
 * This class manages multiple estimators to analyze the link age of a given input.
 */
export class LinkAgeEstimator {
  private opts: Required<LinkAgeOptions>;
  private estimators: (() => Promise<SignalResult>)[] = [];

  /**
   * Creates an instance of LinkAgeEstimator.
   * @param options - Options for configuring the LinkAgeEstimator.
   */
  constructor(options: LinkAgeOptions = {}) {
    this.opts = validateOptions(options);

    const { logHandler: log, providerSecrets } = this.opts;

    /**
     * Adds an estimator to the list if enabled.
     * @param enabled - Indicates whether the estimator should be added.
     * @param Estimator - The estimator class to instantiate.
     * @param label - A label for logging purposes.
     */
    const add = (enabled: boolean, Estimator: any, label: string) => {
      if (!enabled) return;
      this.estimators.push(async () => {
        log(`start:${label}`);
        try {
          const est = new Estimator(this.opts);
          const result = await est.estimate(this.opts.input);
          log(`success:${label}`);
          return { ...result, source: label };
        } catch (err: any) {
          log(`error:${label}`);
          return { source: label, error: err.message };
        }
      });
    };

    add(this.opts.enableWhois, WhoisEstimator, 'whois');
    add(this.opts.enableCt, CTEstimator, 'ct');
    add(this.opts.enableDns, DnsEstimator, 'dns');
    add(this.opts.enableWayback, WaybackEstimator, 'wayback');
    add(this.opts.enableUrlscan, UrlscanEstimator, 'urlscan');
    add(this.opts.enableShodan, ShodanEstimator, 'shodan');
    add(this.opts.enableRevocation, RevocationEstimator, 'revocation');
    add(this.opts.enableCloudflareUrlscan, CloudflareUrlscanEstimator, 'cloudflare-urlscan');
    add(this.opts.enableCensys, CensysEstimator, 'censys');
    add(this.opts.enableSafeBrowsing, SafeBrowsingEstimator, 'safebrowsing');
    add(this.opts.enableCommonCrawl, CommonCrawlEstimator, 'commoncrawl');

    // Add any user-supplied, external/internal plugins
    if (this.opts.plugins?.length) {
      for (const plugin of this.opts.plugins) {
        if (plugin.setup) plugin.setup(this.opts); add(true, plugin.estimate.bind(plugin), plugin.source);
      }
    }
  }

  /**
   * Estimates link age based on the provided input.
   * @param input - The input URL or domain to evaluate.
   * @returns A promise that resolves to a LinkAgeResult containing the evaluation results.
   */
  async estimate(input: string): Promise<LinkAgeResult> {
    this.opts.input = input;

    /**
     * Executes tasks with a limit on concurrency.
     * @param tasks - An array of tasks to execute.
     * @param limit - The maximum number of concurrent tasks.
     * @returns A promise that resolves to an array of results.
     */
    const runWithLimit = async <T>(
      tasks: (() => Promise<T>)[],
      limit: number
    ): Promise<T[]> => {
      const results: T[] = [];
      const executing: Promise<void>[] = [];

      for (const task of tasks) {
        const p = task().then((res) => {
          results.push(res);
        });
        executing.push(p);
        if (executing.length >= limit) await Promise.race(executing);
      }

      await Promise.all(executing);
      return results;
    };

    const signals = await runWithLimit(this.estimators, this.opts.concurrencyLimit);
    const { score, earliest } = scoreSignals(signals, this.opts);
    const confidence = getConfidence(signals, this.opts);
    const humanReadable = formatSummary(earliest, score, confidence);

    return {
      input,
      signals,
      earliest,
      score,
      confidence,
      humanReadable
    };
  }
}