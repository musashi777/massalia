const expectedOrigin = new URL(
  process.argv[2] || process.env.SITE_URL || 'https://massalia-puce.vercel.app'
).origin;

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function extract(html, pattern) {
  return html.match(pattern)?.[1] || null;
}

async function fetchText(pathname) {
  const response = await fetch(`${expectedOrigin}${pathname}`, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
    redirect: 'follow',
  });
  const text = await response.text();
  return { response, text };
}

async function inspectProduction() {
  const errors = [];
  const [{ response: pageResponse, text: html }, { response: sitemapResponse, text: sitemap }, { response: robotsResponse, text: robots }] = await Promise.all([
    fetchText('/'),
    fetchText('/sitemap.xml'),
    fetchText('/robots.txt'),
  ]);

  for (const [name, response] of [
    ['homepage', pageResponse],
    ['sitemap', sitemapResponse],
    ['robots', robotsResponse],
  ]) {
    if (!response.ok) errors.push(`${name}: HTTP ${response.status}`);
  }

  const canonical = extract(html, /<link rel="canonical" href="([^"]+)">/i);
  const ogUrl = extract(html, /<meta property="og:url" content="([^"]+)">/i);
  const expectedHomepage = `${expectedOrigin}/`;
  const robotsHeader = pageResponse.headers.get('x-robots-tag') || '';
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

  if (canonical !== expectedHomepage) errors.push(`canonical: ${canonical || 'missing'}`);
  if (ogUrl !== expectedHomepage) errors.push(`og:url: ${ogUrl || 'missing'}`);
  if (/noindex/i.test(robotsHeader)) errors.push(`x-robots-tag: ${robotsHeader}`);
  if (/<meta[^>]+(?:name|property)="robots"[^>]+noindex/i.test(html)) errors.push('homepage: meta robots noindex');
  if (locations.length === 0) errors.push('sitemap: no URL');
  if (locations.some(location => !location.startsWith(`${expectedOrigin}/`))) errors.push('sitemap: foreign origin');
  if (!robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) errors.push('robots: wrong sitemap URL');

  return errors;
}

async function main() {
  const attempts = 6;
  let errors = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      errors = await inspectProduction();
    } catch (error) {
      errors = [error.message];
    }

    if (errors.length === 0) {
      console.log(`Production SEO verified: ${expectedOrigin}`);
      return;
    }

    if (attempt < attempts) await wait(5000);
  }

  console.error(`Production SEO verification failed for ${expectedOrigin}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

main();
