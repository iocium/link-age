import { SignalResult } from '../utils';

interface CtEntry {
  not_before?: string;
}

const CERTSPOTTER_MAX_PAGES = 10;

export class CTEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');

    // Primary source: crt.sh (free, returns earliest dates when up).
    try {
      const crtEntries = await this.queryCrtSh(domain);
      if (crtEntries.length) {
        return this.buildResult(crtEntries);
      }
    } catch {
      // Fall through to Cert Spotter.
    }

    // Fallback source: Cert Spotter (more reliable, but paginates newest-first).
    const certspotterEntries = await this.queryCertSpotter(domain);
    return this.buildResult(certspotterEntries);
  }

  private async queryCrtSh(domain: string): Promise<CtEntry[]> {
    const endpoint = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
    const url = this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` : endpoint;

    const res = await fetch(url, {
      headers: { 'User-Agent': this.opts.userAgent },
    });

    if (!res.ok) {
      throw new Error(`CT crt.sh query failed with status ${res.status}`);
    }

    const entries = await res.json() as CtEntry[];
    return Array.isArray(entries) ? entries.filter(e => e && e.not_before) : [];
  }

  private async queryCertSpotter(domain: string): Promise<CtEntry[]> {
    let url: string | undefined = this.buildCertSpotterUrl(domain);
    const headers: HeadersInit = { 'User-Agent': this.opts.userAgent };

    const apiKey = this.opts.providerSecrets?.certspotterApiKey;
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const collected: CtEntry[] = [];
    let pages = 0;

    while (url && pages < CERTSPOTTER_MAX_PAGES) {
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(`CT Cert Spotter query failed with status ${res.status}`);
      }

      const page = await res.json() as CtEntry[];
      if (!Array.isArray(page) || page.length === 0) {
        break;
      }

      collected.push(...page.filter(e => e && e.not_before));
      pages++;

      const linkHeader = res.headers?.get('link') || '';
      const nextMatch = linkHeader.match(/<([^>]+)>\s*;\s*rel="next"/);
      // Cert Spotter's Link header currently omits /v1 from the next URL, so fix it.
      const nextUrl = nextMatch ? nextMatch[1].replace('https://api.certspotter.com/issuances?', 'https://api.certspotter.com/v1/issuances?') : undefined;
      url = nextUrl ? this.proxyUrl(nextUrl) : undefined;
    }

    return collected;
  }

  private buildCertSpotterUrl(domain: string): string {
    const endpoint = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=false&match_wildcards=true`;
    return this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(endpoint)}` : endpoint;
  }

  private proxyUrl(url: string): string {
    return this.opts.corsProxy ? `${this.opts.corsProxy}${encodeURIComponent(url)}` : url;
  }

  private buildResult(entries: CtEntry[]): SignalResult {
    const notBeforeTimestamps = Array.from(
      new Set(entries.map(entry => new Date(entry.not_before!).getTime()))
    ).filter(t => !isNaN(t));

    if (notBeforeTimestamps.length === 0) {
      throw new Error('CT logs returned no valid certificate dates');
    }

    const earliestTimestamp = Math.min(...notBeforeTimestamps);
    const earliest = new Date(earliestTimestamp);

    return {
      source: 'ct',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.75
    };
  }
}
