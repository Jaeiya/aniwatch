import { HTTP } from './http.js';
import { Logger } from './logger.js';

const _nyaaURLStr = 'https://nyaa.si';
const _cc = Logger.consoleColors;

export async function getFansubRSS(animeName: string) {
  const url = new URL(_nyaaURLStr);
  url.searchParams.append('f', '2');
  url.searchParams.append('c', '1_2');
  url.searchParams.append('q', `subsplease 1080p ${animeName}`);
  const resp = await HTTP.get(url);
  if (!resp.ok) {
    console.log(await resp.text());
    process.exit(1);
  }
  const [entryCount, title] = await getLatestAnimeEntry(await resp.text());
  url.searchParams.append('page', 'rss');
  return {
    entryCount,
    latestTitle: title,
    rss: url.toString(),
  };
}

async function getLatestAnimeEntry(html: string) {
  Logger.info(`${_cc.byw}Importing JSDOM Library...`);
  const JSDOM = (await import('jsdom')).JSDOM;
  Logger.info(`${_cc.byw}Parsing DOM...`);
  const dom = new JSDOM(html);
  const els = dom.window.document.querySelectorAll<HTMLTableRowElement>('.success');
  if (!els[0]) {
    Logger.error('Anime Not Found');
    process.exit(1);
  }
  const anchorEl = els[0].children[1].children[0];
  if (anchorEl.classList.contains('comments')) {
    return [els.length, els[0].children[1].children[1].textContent];
  }
  return [els.length, els[0].children[1].children[0].textContent];
}
