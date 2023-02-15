import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu, SerializedAnime } from '../../kitsu/kitsu.js';
import { Logger } from '../../logger.js';

const { h1, h2, em, d, f, arg, x, ex } = Help.colors;
const _cc = Logger.consoleColors;
const { nl } = Help.textFlowUtils;

export class FindAnimeFlag implements CLIFlag {
  name: CLIFlagName = ['f', 'find-anime'];
  type: CLIFlagType = 'multiArg';

  helpAliases: string[] = [
    ...this.name,
    'find anime',
    'get anime',
    'lookup anime',
    'search anime',
  ];

  helpSyntax: string[] = [
    `${h2}Syntax:`,
    `${nl}${ex}aniwatch ${x}[${f}-f ${x}| ${f}--find-anime${x}] ${arg}<name>`,
    '',
    `${h2}Details:`,
    `${nl}${arg}name    ${x}Anime name in your "currently watching" list on Kitsu.`,
    '',
    `${h2}Examples:`,
    `${nl}${ex}aniwatch ${f}-f ${arg}"boku no hero"`,
    `${nl}${ex}aniwatch ${f}--find-anime ${arg}berserk`,
  ];

  helpDisplay: string[] = [
    `${h1}Find Anime:`,
    `${nl}This flag allows you to lookup an anime that already`,
    `${nl}exists in your "currently watching" list, which is`,
    `${nl}cached on your disk.`,
    '',
    `${nl}${em}NOTE:${d} If the anime is not found, either it was typed`,
    `${nl}incorrectly or it needs to be added to your watch`,
    `${nl}list. If you add it to your watch list, you'll need`,
    `${nl}to rebuild the cache with ${f}-rc ${d}or ${f}--rebuild-cache${d}.`,
    '',
    ...this.helpSyntax,
  ];

  async exec(cli: typeof CLI) {
    const animeList = await getAnimeList(cli);
    displayAnimeList(animeList);
  }
}

async function getAnimeList(cli: typeof CLI) {
  const animeList = await Kitsu.findAnime(cli.nonFlagArgs.join(' '));
  if (!animeList.length) {
    Logger.chainInfo([
      `${ex}No Entries Found`,
      'The anime is either not in your cache or your search',
      'terms were incorrectly spelled.',
    ]);
    process.exit(0);
  }
  return animeList;
}

function displayAnimeList(animeList: SerializedAnime[]) {
  animeList.forEach((anime) => {
    const totalEps = anime.totalEpisodes ? anime.totalEpisodes : `${_cc.rd}unknown`;
    Logger.chainInfo([
      `${f}Title JP: ${x}${anime.title_jp}`,
      `${f}Title EN: ${x}${anime.title_en}`,
      `${f}Progress: ${_cc.gn}${anime.progress}${ex} / ${em}${totalEps}`,
      `${f}My Rating: ${_cc.gn}${anime.rating ? anime.rating : 'Not Rated'}`,
      `${f}Avg. Rating: ${_cc.gn}${anime.avgRating}`,
      '',
    ]);
  });
}
