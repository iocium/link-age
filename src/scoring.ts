import type { SignalResult, LinkAgeOptions } from './utils';

export function scoreSignals(signals: SignalResult[], opts: Required<LinkAgeOptions>) {
  const valid = signals.filter(s => s.date && !s.error);
  if (!valid.length) return { score: 0, earliest: undefined };

  const timestamps = valid.map(s => s.date!.getTime());
  const earliestTs = Math.min(...timestamps);
  const earliest = new Date(earliestTs);

  let score = 0;
  for (const signal of valid) {
    const diffDays = Math.abs((signal.date!.getTime() - earliestTs) / 86400000);
    const trustMultiplier = getTrustMultiplier(signal.trustLevel);
    const proximityBonus = diffDays <= opts.stopOnConfidence.withinDays ? 1.5 : 1;
    const weight = (signal.weight ?? 1) * trustMultiplier * proximityBonus;
    score += weight;
  }

  return { score, earliest };
}

function getTrustMultiplier(level: string | undefined): number {
  switch (level) {
    case 'authoritative': return 1.5;
    case 'observed': return 1.0;
    case 'inferred': return 0.75;
    default: return 1.0;
  }
}

export function getConfidence(signals: SignalResult[], opts: Required<LinkAgeOptions>): 'none' | 'low' | 'medium' | 'high' {
  const valid = signals.filter(s => s.date && !s.error);
  if (valid.length === 0) return 'none';

  const timestamps = valid.map(s => s.date!.getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const range = (max - min) / 86400000; // days
  const count = valid.length;

  if (count >= opts.stopOnConfidence.minSignals && range <= opts.stopOnConfidence.withinDays) {
    return 'high';
  } else if (count >= opts.stopOnConfidence.minSignals) {
    return 'medium';
  } else {
    return 'low';
  }
}