import { LinkAgeEstimator } from './linkage';
import { generateHtmlReport } from './report/html';
import { generateMarkdownReport } from './report/markdown';
import type { LinkAgeOptions, LinkAgeResult, LinkAgePlugin, SignalResult } from './utils';

export {
  LinkAgeEstimator,
  generateHtmlReport,
  generateMarkdownReport,
};
export type { LinkAgeOptions, LinkAgeResult, LinkAgePlugin, SignalResult };
export default LinkAgeEstimator;