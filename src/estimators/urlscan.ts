import { SignalResult } from '../utils';

export class UrlscanEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const key = this.opts.providerSecrets?.urlscanApiKey;
    if (!key) throw new Error('Missing URLScan API key');
    const endpoint = `https://urlscan.io/api/v1/search/?q=domain:${domain}`
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;
    const res = await fetch(url, {
      headers: {
        'API-Key': key,
        'User-Agent': this.opts.userAgent
      }
    });
    const json = await res.json();
    const timestamps = json.results?.map((r: any) => new Date(r.task.time)).filter((d: Date) => !isNaN(d.getTime()));
    if (!timestamps?.length) throw new Error('No historical URLScan data found');
    const earliest = new Date(Math.min(...timestamps.map((d: Date) => d.getTime())));
    return {
      source: 'urlscan',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.7
    };
  }
}