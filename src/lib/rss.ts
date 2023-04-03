import { HTTP } from './http.js';

const _nyaaURLStr = 'https://nyaa.si';
const _printLoader = _con.getLoadPrinter();

export async function getFansubRSS(searchString: string) {
    console.log('');
    _printLoader.start(`Looking up "${searchString}"`);
    const url = new URL(_nyaaURLStr);
    url.searchParams.append('f', '0');
    url.searchParams.append('c', '1_2');
    url.searchParams.append('q', searchString);
    const resp = await HTTP.get(url);
    if (!resp.ok) {
        _printLoader.stop();
        console.log(await resp.text());
        process.exit(1);
    }
    const [entryCount, latestTitle] = await getLatestAnimeEntry(await resp.text());
    url.searchParams.append('page', 'rss');
    return {
        entryCount,
        latestTitle,
        rss: url.toString(),
    };
}

async function getLatestAnimeEntry(html: string) {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    const els = $('tr td + td');
    const numOfResults = $('tr').length;
    const latestTitle =
        els.children('a.comments + a').eq(0).text().trim() || els.children('a').eq(0).text();
    _printLoader.stop();
    if (!els.length) {
        _con.error('Anime Not Found');
        process.exit(1);
    }
    return [numOfResults, latestTitle];
}
