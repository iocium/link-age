import { SignalResult } from '../utils';

export class WhoisEstimator {
  constructor(
    private opts: {
      corsProxy?: string;
      userAgent?: string;
    }
  ) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const endpoint = `https://rdap.org/domain/${domain}`;
    const url = this.opts.corsProxy
      ? this.opts.corsProxy + encodeURIComponent(endpoint)
      : endpoint;

    const res = await fetch(url, {
      headers: {
        'User-Agent': this.opts.userAgent ?? 'iocium/link-age (browser)',
      },
    });

    if (res.status === 404) {
      return {
        source: 'whois',
        trustLevel: 'negative',
        weight: -1.0,
        error: 'Domain not found in RDAP (HTTP 404)',
      };
    }

    if (!res.ok) {
      throw new Error(`WHOIS fetch failed with status ${res.status}`);
    }

    const data = await res.json();

    const statusFlags = (data.status ?? []) as string[];
    const isHeld = statusFlags.some((s) => s.toLowerCase().includes('hold'));

    const regEvent = data.events?.find(
      (e: { eventAction: string }) => e.eventAction === 'registration'
    );
    const date = regEvent ? new Date(regEvent.eventDate) : undefined;

    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid or missing WHOIS registration date');
    }

    return {
      source: 'whois',
      date,
      trustLevel: isHeld ? 'negative' : 'authoritative',
      weight: isHeld ? -0.8 : 1.0,
      metadata: isHeld ? { statusFlags } : undefined,
    };
  }
}