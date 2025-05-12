import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const { startUrl } = input;

const requestQueue = await Actor.openRequestQueue();
await requestQueue.addRequest({ url: startUrl, userData: { label: 'START' } });

const crawler = new Actor.PuppeteerCrawler({
    requestQueue,
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },
    async handlePageFunction({ request, page }) {
        const url = request.url;

        if (request.userData.label === 'START') {
            await page.waitForSelector('a[href*="/datasets/"][href$="/about"]', { timeout: 30000 });
            const links = await page.$$eval('a[href*="/datasets/"][href$="/about"]', els =>
                els.map(el => el.href)
            );
            for (const link of links) {
                await requestQueue.addRequest({ url: link, userData: { label: 'DETAIL' } });
            }
        } else if (request.userData.label === 'DETAIL') {
            const title = await page.$eval('h1.MuiTypography-root', el => el.textContent.trim());
            const description = await page.$eval('p.MuiTypography-root', el => el.textContent.trim());
            const format = await page.$$eval('[data-testid="DatasetFormatChip"]', els => els.map(el => el.textContent.trim()).join(', '));
            const updated = await page.$eval('time', el => el.getAttribute('datetime')) || 'N/A';
            const downloadLink = await page.$$eval('a[href*="download"], a[href*="api"], a[href*="data"]',
                links => links.length > 0 ? links[0].href : 'N/A');

            await Actor.pushData({
                title,
                description,
                format,
                lastUpdated: updated,
                pageUrl: url,
                downloadLink
            });
        }
    },
    maxRequestsPerCrawl: 100,
    maxConcurrency: 5
});

await crawler.run();
await Actor.exit();
