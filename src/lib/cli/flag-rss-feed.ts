import { Help } from '../help.js';
import CLI, { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Logger } from '../logger.js';
import * as rss from '../rss.js';

const { h1, h2, d, f, arg, x, ex } = Help.colors;
const _cc = Logger.consoleColors;
const { nl } = Help.textFlowUtils;

export class RSSFeedFlag implements CLIFlag {
  name: CLIFlagName = ['rss', 'rss-feed'];
  type: CLIFlagType = 'multiArg';
  helpAliases: string[] = [
    ...this.name,
    'rss',
    'feed',
    'get rss',
    'find rss',
    'search rss',
    'lookup rss',
  ];
  helpSyntax: string[] = [
    `${h2}Syntax:`,
    `${nl}${ex}aniwatch ${x}[${f}-rss ${x}| ${f}--rss-feed${x}] ${arg}<name>`,
    '',
    `${h2}Details:`,
    `${nl}${arg}name    ${x}Name of any anime`,
    '',
    `${h2}Examples:`,
    `${nl}${ex}aniwatch ${f}-rss ${arg}"boku no hero"`,
    `${nl}${ex}aniwatch ${f}--rss-feed ${arg}berserk`,
  ];
  helpDisplay: string[] = [
    `${h1}RSS Feed:`,
    `${nl}Searches ${x}nyaa.si${d} for an anime name filtered by`,
    `${nl}${x}SubsPlease ${d}and ${x}1080p${d}. This results in the number`,
    `${nl}of torrents found, file-name of latest torrent`,
    `${nl}and an RSS Feed link.`,
    '',
    `${nl}${_cc.ma}NOTE:${d} This allows you to quickly set up RSS for your`,
    `${nl}torrents to be downloaded automatically. The number`,
    `${nl}of entries should clue you in on whether or not you`,
    `${nl}need to refine your search.`,
    '',
    ...this.helpSyntax,
  ];

  async exec() {
    const result = await rss.getFansubRSS(CLI.nonFlagArgs.join(' '));
    Logger.chainInfo([
      `${_cc.bcn}Entry Count: ${_cc.gn}${result.entryCount}`,
      `${_cc.bcn}Latest: ${_cc.yw}${result.latestTitle}`,
      `${_cc.bcn}RSS: ${_cc.x}${result.rss}`,
    ]);
  }
}
