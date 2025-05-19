import { SignalResult } from "../utils";

export function generateMarkdownReport(result: any, input: string): string {
  const rows = result.signals.map((sig: SignalResult) =>
    `| ${sig.source} | ${sig.date || ("ERROR: " + sig.error)} | ${sig.trustLevel || ""} | ${sig.weight !== undefined ? sig.weight.toFixed(2) : ""} |`
  ).join("\n");

  return `# Link-Age Report for ${input}

**Summary:**  
${result.humanReadable}

## Signals

| Source | Date | Trust | Weight |
|--------|------|--------|--------|
${rows}

---

## How to Read This Report

- **Confidence:** reflects how closely different sources agree and how trustworthy they are.
- **Trust Levels:**
  - **authoritative** – from official records (e.g. WHOIS)
  - **observed** – seen in public infrastructure (e.g. CT logs, DNS, URLScan)
  - **inferred** – derived from indirect analysis (e.g. revocation, Safe Browsing)
- **Weights:** indicate signal importance in scoring (range: 0–1.0)

**Generated:** ${new Date().toISOString()}  
[link-age](https://github.com/iocium/link-age)`;
}