import { HTTP } from './http.js';
import { parseFansubFilename } from './utils.js';

const _nyaaURLStr = 'https://nyaa.si';

type RSSEntry = {
    entryCount: number;
    fansub: `[${string}]`;
    title: string;
    episode: string;
    season?: string;
    bitrate?: string;
    rss: string;
};

/**
 * Gets a list of RSS entries matching the searchString
 * and returns a breakdown of the latest entry.
 */
export async function getFansubRSS(searchString: string) {
    const url = new URL(_nyaaURLStr);
    url.searchParams.append('f', '0');
    url.searchParams.append('c', '1_2');
    url.searchParams.append('q', searchString);
    const resp = await HTTP.get(url);
    if (!resp.ok) {
        console.log(await resp.text());
        process.exit(1);
    }
    const [entryCount, latestEntryName] = await getLatestAnimeEntry(await resp.text());
    url.searchParams.append('page', 'rss');
    if (!latestEntryName) {
        return [null, null] as const;
    }
    const [error, data] = parseFansubFilename(latestEntryName);
    if (error) {
        return [error, null] as const;
    }
    const { title, fansub, paddedEpNum, season, bitrate } = data;

    const entry: RSSEntry = {
        entryCount,
        fansub: `[${fansub}]`,
        title,
        episode: paddedEpNum,
        season,
        bitrate,
        rss: url.toString(),
    };
    return [null, entry] as const;
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
    if (!torrents.length) {
        return [0, null] as const;
    }
    return [torrents.length, latestEntryName] as const;
}
