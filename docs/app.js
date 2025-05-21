import { LinkAgeEstimator } from './link-age.js';

function getKey(id) {
  const el = document.getElementById(id);
  const value = el.value.trim();
  localStorage.setItem(id, value);
  return value || undefined;
}

function restoreKeys() {
  ['shodanKey', 'urlscanKey', 'censysId', 'censysSecret', 'cloudflareAccount', 'cloudflareKey'].forEach(id => {
    const el = document.getElementById(id);
    const val = localStorage.getItem(id);
    if (val) el.value = val;
  });
}

restoreKeys();

document.getElementById('age-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('input').value.trim();
  const reportEl = document.getElementById('report');
  reportEl.innerHTML = '<p>Running estimation...</p>';

  const providerSecrets = {
    cloudflareAccountId: getKey('cloudflareAccount'),
    cloudflareApiKey: getKey('cloudflareKey'),
    shodanApiKey: getKey('shodanKey'),
    urlscanApiKey: getKey('urlscanKey'),
    censysApiId: getKey('censysId'),
    censysApiSecret: getKey('censysSecret')
  };

  const estimator = new LinkAgeEstimator({
    enableCt: document.getElementById('ct').checked,
    enableWayback: document.getElementById('wayback').checked,
    enableSafeBrowsing: document.getElementById('safebrowsing').checked,
    enableDns: document.getElementById('dns').checked,
    enableShodan: !!providerSecrets.shodanApiKey,
    enableUrlscan: !!providerSecrets.urlscanApiKey,
    enableCensys: !!(providerSecrets.censysApiId && providerSecrets.censysApiSecret),
    enableCloudflare: !!(providerSecrets.cloudflareAccountId && providerSecrets.cloudflareApiKey),
    enableCommonCrawl: document.getElementById('commoncrawl').checked,
    providerSecrets,
    logHandler: (msg) => console.log(msg),
    corsProxy: 'https://cors.iocium.workers.dev/?url='
  });

  try {
    const result = await estimator.estimate(input);
    reportEl.innerHTML = result.htmlReport || '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
  } catch (err) {
    reportEl.innerHTML = '<p class="error">Error: ' + err.message + '</p>';
  }
});