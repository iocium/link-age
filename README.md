# @iocium/link-age

Phishing detection. Threat intelligence. Fraud prevention. Estimate when a domain or URL was first seen using WHOIS, CT logs, DNS, Wayback Machine, and more.

[![npm](https://img.shields.io/npm/v/@iocium/link-age)](https://www.npmjs.com/package/@iocium/link-age)
[![build](https://github.com/iocium/link-age/actions/workflows/test.yml/badge.svg)](https://github.com/iocium/link-age/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/iocium/link-age/branch/main/graph/badge.svg)](https://codecov.io/gh/iocium/link-age)
[![npm downloads](https://img.shields.io/npm/dm/@iocium/link-age)](https://www.npmjs.com/package/@iocium/link-age)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@iocium/link-age)](https://bundlephobia.com/package/@iocium/link-age)
[![types](https://img.shields.io/npm/types/@iocium/link-age)](https://www.npmjs.com/package/@iocium/link-age)
[![license](https://img.shields.io/npm/l/@iocium/link-age)](https://github.com/iocium/link-age/blob/main/LICENSE)

---

## ✨ Features

- Multi-source domain & URL age estimation
- Composite scoring with trust levels & signal agreement
- Pretty HTML, JSON, and summary output modes
- Extensible plugin-style estimators
- CLI and JS API support (Node, Workers, etc.)

---

## 🚀 Installation

```bash
npm install -g @iocium/link-age
````

---

## ⚡ Quick Start

```bash
link-age https://example.com
```

You’ll see output like:

```
Earliest observed: 2023-02-01T12:00:00Z
```

---

## ⚙️ CLI Options

| Option                  | Description                             |
| ----------------------- | --------------------------------------- |
| `--json`                | Output raw JSON                         |
| `--html`                | Output pretty HTML                      |
| `--out <file>`          | Write to file                           |
| `--timeout <ms>`        | API timeout (default: 8000)             |
| `--min-signals <n>`     | Minimum required signals (default: 2)   |
| `--within-days <n>`     | Signal agreement threshold (default: 5) |
| `--concurrency <n>`     | Parallel estimator limit (default: 3)   |
| `--user-agent <string>` | Override default User-Agent             |

---

## 🔍 Estimators

### Enabled by Default:

* WHOIS / RDAP (`--no-whois`)
* Certificate Transparency (`--no-ct`)
* Wayback Machine (`--no-wayback`)
* Google Safe Browsing (`--no-safebrowsing`)

### Opt-In:

| Flag           | Description                       |
| -------------- | --------------------------------- |
| `--dns`        | Passive DNS (multiple providers)  |
| `--urlscan`    | Historical scans via urlscan.io   |
| `--shodan`     | First-seen IP/banners from Shodan |
| `--censys`     | Passive data from Censys Search   |
| `--revocation` | Revoked certs via Cert Spotter    |

---

## ✅ Example JSON Output

```json
{
  "input": "https://example.com",
  "earliest": "2023-02-01T12:00:00Z",
  "confidence": "high",
  "score": 3.5,
  "signals": [
    {
      "source": "ct",
      "date": "2023-02-01T12:00:00Z",
      "trustLevel": "observed",
      "weight": 0.75
    }
  ]
}
```

---

## 🖥️ HTML Report

* Summary & scoring
* Trust-weighted signal breakdown
* Diagnostic footnotes
* Printable

---

## 🔧 Programmatic Usage

```ts
import { LinkAgeEstimator } from '@iocium/link-age';

const estimator = new LinkAgeEstimator({
  enableUrlscan: true,
  concurrencyLimit: 4,
  userAgent: "my-custom-agent/1.0",
  providerSecrets: {
    urlscanApiKey: "...",
    censysApiId: "...",
    censysApiSecret: "..."
  }
});

const result = await estimator.estimate('https://example.com');
```

---

## 📦 Integrations

Compatible with:

* Node.js
* Cloudflare Workers
* Browser (ESM-safe)
* CI pipelines

---

## 🔐 Privacy & Trust

All estimators are opt-in and transparent. API keys are never logged. You control the budget and data flow.

---

## © License

MIT.

Built by [iocium](https://github.com/iocium) with care.