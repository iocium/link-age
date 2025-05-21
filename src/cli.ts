import { Command } from 'commander';
import { LinkAgeEstimator } from './index';
import { writeFileSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';
import { generateHtmlReport } from './report/html';
import { generateMarkdownReport } from './report/markdown';

const program = new Command();
program
  .name('link-age')
  .description('Estimate the first-seen or creation time of a domain or URL')
  .argument('<input>', 'URL or domain to analyze')
  .option('-j, --json', 'Output raw JSON instead of summary')
  .option('--html', 'Output pretty HTML report')
  .option('--markdown', 'Output Markdown report')
  .option('--no-whois', 'Disable WHOIS/RDAP estimation')
  .option('--no-ct', 'Disable Certificate Transparency (CT) log estimation')
  .option('--no-wayback', 'Disable Wayback Machine estimation')
  .option('--no-safebrowsing', 'Disable Google Safe Browsing estimation')
  .option('--dns', 'Enable passive DNS estimation', false)
  .option('--cloudflare', 'Enable Cloudflare URL Scanner / Radar estimation', false)
  .option('--urlscan', 'Enable URLScan historical lookup', false)
  .option('--shodan', 'Enable Shodan banner-based estimation', false)
  .option('--censys', 'Enable Censys host lookup', false)
  .option('--revocation', 'Enable revocation signal estimation', false)
  .option('--commoncrawl', 'Enable Common Crawl estimator', false)
  .option('--timeout <ms>', 'Timeout for estimators', parseInt, 8000)
  .option('--min-signals <n>', 'Minimum valid signals before early exit', parseInt, 2)
  .option('--within-days <n>', 'Closeness threshold for signal confidence', parseInt, 5)
  .option('--concurrency <n>', 'Max number of estimators to run in parallel', parseInt, 3)
  .option('--user-agent <string>', 'Override default User-Agent header')
  .option('--out <file>', 'Write output to file')
  .parse();

const opts = program.opts();
const input = program.args[0];

const spinnerMap = new Map();
const startTimes = new Map();
const logHandler = (msg: string) => {
  const [action, source] = msg.split(':');
  const now = new Date();
  if (action === 'start') {
    const spin = ora(`⏳ [${now.toISOString()}] Running ${source}...`).start();
    spinnerMap.set(source, spin);
    startTimes.set(source, now.getTime());
  } else if (action === 'success') {
    const start = startTimes.get(source) || now.getTime();
    const duration = ((now.getTime() - start) / 1000).toFixed(2);
    spinnerMap.get(source)?.succeed(`✅ [${now.toISOString()}] ${source} finished in ${duration}s`);
  } else if (action === 'error') {
    const start = startTimes.get(source) || now.getTime();
    const duration = ((now.getTime() - start) / 1000).toFixed(2);
    spinnerMap.get(source)?.fail(`❌ [${now.toISOString()}] ${source} failed after ${duration}s`);
  }
};

(async () => {
  const cliStart = Date.now();
  const estimator = new LinkAgeEstimator({
    enableWhois: opts.whois,
    enableCt: opts.ct,
    enableDns: opts.dns,
    enableWayback: opts.wayback,
    enableUrlscan: opts.urlscan,
    enableShodan: opts.shodan,
    enableCensys: opts.censys,
    enableCloudflareUrlscan: opts.cloudflare,
    enableRevocation: opts.revocation,
    enableSafeBrowsing: opts.safebrowsing,
    enableCommonCrawl: opts.commoncrawl,
    timeoutMs: opts.timeout,
    concurrencyLimit: opts.concurrency,
    userAgent: opts.userAgent,
    stopOnConfidence: {
      minSignals: opts.minSignals,
      withinDays: opts.withinDays,
    },
    logHandler,
    providerSecrets: {
      urlscanApiKey: process.env.URLSCAN_API_KEY,
      shodanApiKey: process.env.SHODAN_API_KEY,
      securitytrailsApiKey: process.env.SECURITYTRAILS_API_KEY,
      passiveTotalUsername: process.env.PASSIVETOTAL_USERNAME,
      passiveTotalApiKey: process.env.PASSIVETOTAL_APIKEY,
      farsightApiKey: process.env.FARSIGHT_APIKEY,
      certspotterApiKey: process.env.CERTSPOTTER_APIKEY,
      censysApiId: process.env.CENSYS_API_ID,
      censysApiSecret: process.env.CENSYS_API_SECRET,
      cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      cloudflareApiKey: process.env.CLOUDFLARE_API_KEY
    },
  });

  const result = await estimator.estimate(input);

  const totalMs = Date.now() - cliStart;
  console.log(chalk.gray(`\n— Completed in ${(totalMs / 1000).toFixed(2)}s —`));
  console.log(chalk.bold('\nSummary of signals:'));
  for (const signal of result.signals) {
    const name = chalk.cyan(signal.source);
    if (signal.error) {
      console.log(`${name}: ${chalk.red('ERROR')} ${signal.error}`);
    } else {
      console.log(`${name}: ${chalk.green(signal.date)} ${chalk.dim(`weight=${signal.weight}`)}`);
    }
  }

  const output = opts.html
    ? generateHtmlReport(result, input)
    : opts.markdown
    ? generateMarkdownReport(result, input)
    : opts.json
    ? JSON.stringify(result, null, 2)
    : result.humanReadable;

  if (opts.out) writeFileSync(opts.out, output);
  else console.log(output);
})();