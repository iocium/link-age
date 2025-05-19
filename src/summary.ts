export function formatSummary(earliest: Date | undefined, score: number, confidence: string): string {
  if (!earliest) return 'Domain age unknown. No valid signals returned.';

  const now = new Date();
  const daysOld = Math.floor((now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  let ageString = '';
  if (daysOld < 1) {
    ageString = 'new domain, <1 day old';
  } else if (daysOld < 7) {
    ageString = `new domain, ~${daysOld} days old`;
  } else if (daysOld < 31) {
    ageString = `recent domain, ~${Math.floor(daysOld / 7)} weeks old`;
  } else if (daysOld < 365) {
    ageString = `moderately old domain, ~${Math.floor(daysOld / 30)} months old`;
  } else {
    ageString = `established domain, ~${Math.floor(daysOld / 365)} years old`;
  }

  return `${ageString} (confidence: ${confidence}, score: ${score.toFixed(2)})`;
}