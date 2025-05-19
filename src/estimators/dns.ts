import { SignalResult } from '../utils';

export class DnsEstimator {
  constructor(private opts: any) {}

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname.replace(/^www\./, '');
    const records = await this.queryPassiveDns(domain);
    const timestamps = records
      .map(r => new Date(r.firstSeen))
      .filter(d => !isNaN(d.getTime()));
    if (!timestamps.length) throw new Error('No passive DNS data available');
    const earliest = new Date(Math.min(...timestamps.map(d => d.getTime())));
    return {
      source: 'dns',
      date: earliest,
      trustLevel: 'observed',
      weight: 0.6
    };
  }

  private async queryPassiveDns(domain: string): Promise<{ firstSeen: string }[]> {
    const providers = [];

    if (this.opts.providerSecrets?.securitytrailsApiKey) {
      providers.push(() => this.querySecurityTrails(domain));
    }
    if (this.opts.providerSecrets?.passiveTotalUsername && this.opts.providerSecrets?.passiveTotalApiKey) {
      providers.push(() => this.queryPassiveTotal(domain));
    }

    for (const tryProvider of providers) {
      try {
        const result = await tryProvider();
        if (result.length) return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.opts.logHandler?.(`error:dns:${msg}`);
      }      
    }

    throw new Error('No passive DNS data returned from any provider');
  }

  private async querySecurityTrails(domain: string): Promise<{ firstSeen: string }[]> {
    const key = this.opts.providerSecrets.securitytrailsApiKey;
    const res = await fetch(`https://api.securitytrails.com/v1/domain/${domain}/dns/history/a`, {
      headers: {
        'APIKEY': key,
        'User-Agent': this.opts.userAgent
      }
    });
    const json = await res.json();
    const records = json.records || [];
    return records.map((r: any) => ({ firstSeen: r.first_seen }));
  }

  private async queryPassiveTotal(domain: string): Promise<{ firstSeen: string }[]> {
    const { passiveTotalUsername, passiveTotalApiKey } = this.opts.providerSecrets;
    const res = await fetch(`https://api.passivetotal.org/v2/dns/passive?query=${domain}`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${passiveTotalUsername}:${passiveTotalApiKey}`).toString('base64'),
        'User-Agent': this.opts.userAgent
      }
    });
    const json = await res.json();
    const records = json.results || [];
    return records.map((r: any) => ({ firstSeen: r.firstSeen }));
  }
}