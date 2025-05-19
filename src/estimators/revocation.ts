import type { LinkAgeOptions, SignalResult } from '../utils';

export class RevocationEstimator {
  constructor(private opts: Required<LinkAgeOptions>) {
    if (opts.providerSecrets?.certspotterApiKey === undefined) {
      throw new Error('RevocationEstimator requires certspotterApiKey when enabled');
    }
  }

  async estimate(input: string): Promise<SignalResult> {
    const domain = new URL(input).hostname;
    const apiKey = this.opts.providerSecrets.certspotterApiKey;
    if (!apiKey) return { source: 'revocation', error: 'Missing Cert Spotter API key' };

    try {
      const res = await fetch(
        `https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=false&match_wildcards=true&expand=dns_names,revocation`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(this.opts.timeoutMs),
        }
      );
      if (!res.ok) return { source: 'revocation', error: `Cert Spotter API error: ${res.status}` };

      const json = await res.json();
      const revoked = json.filter((c: any) => c.revocation && c.revocation.revoked);
      if (!revoked.length) return { source: 'revocation', date: undefined, metadata: { revokedCertCount: 0 } };

      const revocationDates = revoked
        .map((c: any) => new Date(c.revocation.revocation_time))
        .filter((d: Date) => !isNaN(d.getTime()));
      const latest = revocationDates.sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];

      return {
        source: 'revocation',
        date: latest ? new Date(latest.toISOString()) : undefined,
        metadata: {
          revokedCertCount: revoked.length,
          lastRevoked: latest?.toISOString(),
          reasons: Array.from(new Set(revoked.map((c: any) => c.revocation.revocation_reason).filter(Boolean)))
        }
      };
    } catch (err: any) {
      return { source: 'revocation', error: err.message };
    }
  }
}