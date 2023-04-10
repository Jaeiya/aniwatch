import { HTTP } from './http.js';
import { parseFansubFilename } from './utils.js';

const _nyaaURLStr = 'https://nyaa.si';
const _printLoader = _con.getLoadPrinter();

/**
 * Gets a list of RSS entries matching the searchString
 * and returns a breakdown of the latest entry.
 */
export async function getFansubRSS(searchString: string) {
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
    const [entryCount, latestEntryName] = await getLatestAnimeEntry(await resp.text());
    url.searchParams.append('page', 'rss');
    const { title, fansub, paddedEpNum, season, bitrate } =
        parseFansubFilename(latestEntryName);
    return {
        entryCount,
        fansub: `[${fansub}]`,
        title,
        episode: paddedEpNum,
        season,
        bitrate,
        rss: url.toString(),
    };
}

async function getLatestAnimeEntry(html: string) {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    const els = $('tr td + td > a');
    const torrents = [];
    for (let i = 0; i < els.length; i++) {
        const elementText = els.eq(i).text().trim();
        if (elementText.length > 10) {
            torrents.push(elementText);
        }
    }
    const latestEntryName = torrents[0];
    _printLoader.stop();
    if (!torrents.length) {
        _con.error('Anime Not Found');
        process.exit(1);
    }
    return [torrents.length, latestEntryName] as const;
}
