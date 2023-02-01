import { Logger } from './logger.js';

const _chainInfo = Logger.chainInfo;
const _ind1 = ' '.repeat(3);
const _ind2 = ' '.repeat(6);
const _cc = Logger.consoleColors;
/** ANSI Clear Char */
const _x = _cc.x;
/** ANSI Bright Black */
const _blk = _cc.bbk;
/** New Line */
const _nl = `${_ind1}${_blk}`;
/** ANSI Heading Color */
const _hd = _cc.bwt;
/** ANSI Subheading Color */
const _shd = _cc.bma;
/** ANSI Flag Color */
const _fl = _cc.bcn;
/** ANSI Arguments Color */
const _arg = _cc.yw;
/** ANSI White Color */
const _wht = _cc.bwt;

export default {
  displayHelpAboutHelp,
  displayFullHelp,
  displayDefaultHelp,
  displayDefaultSyntax,
  displaySimpleFlagHelp,
  displaySimpleFlagSyntax,
  displayFindAnimeHelp,
  displayFindAnimeSyntax,
  displayRefreshTokenHelp,
  displayRSSHelp,
  displayRSSSyntax,
  displayFlagHelp,
  displayComplexFlagHelp,
  getHelpFromFlag,
  getFindAnimeHelp,
  getRSSFeedHelp,
};

function displayHelpAboutHelp() {
  Logger.chainInfo(['', ...getHelpAboutHelp()]);
}

function getHelpFromFlag(flag: string) {
  switch (flag) {
    case 'all':
    case 'full':
    case 'get help':
    case 'get all help':
    case 'default':
      return displayFullHelp();

    case 'h':
    case 'help':
      return displayHelpAboutHelp();

    case 'f':
    case 'find-anime':
    case 'find anime':
    case 'get anime':
    case 'lookup anime':
    case 'search anime':
      return displayFindAnimeHelp();

    case 'rss':
    case 'rss-feed':
    case 'rss feed':
    case 'feed':
    case 'get rss':
    case 'find rss':
    case 'search rss':
    case 'lookup rss':
      return displayRSSHelp();

    case 'p':
    case 'profile':
    case 'display profile':
    case 'show profile':
    case 'get profile':
    case 'lookup profile':
      return displayProfileHelp();

    case 'rp':
    case 'rebuild-profile':
    case 'rebuild profile':
    case 'reload profile':
    case 'load profile':
      return displayRebuildProfileHelp();

    case 'c':
    case 'cache':
    case 'display cache':
    case 'show cache':
    case 'get cache':
    case 'lookup cache':
    case 'list cache':
      return displayCacheHelp();

    case 'rc':
    case 'rebuild-cache':
    case 'rebuild cache':
    case 'reload cache':
    case 'load cache':
      return displayRebuildCacheHelp();

    case 'rt':
    case 'refresh-token':
    case 'refresh token':
    case 'get token':
    case 'renew token':
    case 'token':
    case 'access token':
    case 'get access token':
      return displayRefreshTokenHelp();

    default:
      Logger.error(`Missing ${_cc.byw}${flag}${_cc.x} help`);
      break;
  }
}

function displayFullHelp() {
  _chainInfo([
    ...getDefaultHelp(),
    '',
    '',
    '',
    ...getHelpAboutHelp(),
    '',
    '',
    '',
    ...getSimpleFlagHelp(),
    '',
    '',
    '',
    ...getComplexFlagHelp(),
  ]);
}

function displayDefaultHelp() {
  Logger.chainInfo([...getDefaultHelp()]);
}

function displayDefaultSyntax() {
  Logger.chainInfo([...getDefaultSyntax()]);
}

function displaySimpleFlagHelp() {
  Logger.chainInfo(['', ...getSimpleFlagHelp()]);
}

function displaySimpleFlagSyntax() {
  Logger.chainInfo(['', ...getSimpleFlagSyntax()]);
}

function displayFlagHelp() {
  Logger.chainInfo(['', '', ...getSimpleFlagHelp(), '', '', ...getComplexFlagHelp()]);
}

function displayComplexFlagHelp() {
  Logger.chainInfo(getComplexFlagHelp());
}

function displayFindAnimeHelp() {
  Logger.chainInfo(['', ...getFindAnimeHelp()]);
}

function displayFindAnimeSyntax() {
  Logger.chainInfo(['', ...getFindAnimeSyntax()]);
}

function displayRSSHelp() {
  Logger.chainInfo(['', ...getRSSFeedHelp()]);
}

function displayRSSSyntax() {
  Logger.chainInfo(['', ...getRSSFeedSyntax()]);
}

function getHelpAboutHelp() {
  return [
    `${_hd}Help`,
    `${_nl}Allows you to discover all functionality about`,
    `${_nl}this application.`,
    '',
    `${_shd}Syntax:`,
    `${_nl}${_cc.byw}aniwatch ${_x}[${_fl}-h ${_x}| ${_fl}--help${_x}] ${_arg}<all|flag|desc>`,
    '',
    `${_shd}Details:`,
    `${_ind1}${_arg}all${_x}    Display default help for all flags and arguments.`,
    '',
    `${_ind1}${_arg}flag${_x}   The name of an existing flag that you want more`,
    `${_ind2}    help with.`,
    '',
    `${_ind1}${_arg}desc${_x}   Description of the action you want help for.`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-h ${_arg}all           ${_blk}(Displays all default help)`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-h ${_arg}f             ${_blk}(Displays --find-anime help)`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-h ${_arg}c             ${_blk}(Displays --cache help)`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-h ${_arg}show profile  ${_blk}(Displays --profile help)`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-h ${_arg}reload cache  ${_blk}(Displays --rebuild-cache help)`,
    '',
    `${_shd}Broad Explanation:`,
    `${_nl}When using the ${_arg}desc ${_blk}argument, think of the event`,
    `${_nl}you're trying to get help with. If you want to know how`,
    `${_nl}to lookup an existing anime, you could type something`,
    `${_nl}like ${_wht}search anime ${_blk}or ${_wht}lookup anime ${_blk}as a ${_arg}desc ${_blk}argument.`,
    '',
    `${_nl}There's still a possibility that you type in an unknown`,
    `${_nl}description, but if you think about it long enough, you`,
    `${_nl}should be able to figure out a known description for`,
    `${_nl}the functionality you're looking for.`,
  ];
}

function displayProfileHelp() {
  Logger.chainInfo([
    `${_hd}Display Profile:`,
    `${_nl}This flag allows you to display your currently logged`,
    `${_nl}in user profile. The displays your Username, About,`,
    `${_nl}Profile Link, Watch Time, and Completed Series count.`,
    '',
    ...getNoArgSyntax(['p', 'profile']),
  ]);
}

function displayCacheHelp() {
  Logger.chainInfo([
    `${_hd}Display Cache:`,
    `${_nl}This flag allows you to display the currently saved`,
    `${_nl}cache information.`,
    '',
    ...getNoArgSyntax(['c', 'cache']),
  ]);
}

function displayRebuildProfileHelp() {
  Logger.chainInfo([
    '',
    `${_hd}Rebuild Profile:`,
    `${_nl}Rebuilds your profile data from Kitsu. This is`,
    `${_nl}useful if you want up-to-date watch time info`,
    `${_nl}after you've watched an episode.`,
    '',
    ...getNoArgSyntax(['rb', 'rebuild-profile']),
  ]);
}

function displayRebuildCacheHelp() {
  Logger.chainInfo([
    '',
    `${_hd}Rebuild Cache:`,
    `${_nl}Rebuilds your cache data from Kitsu. This is`,
    `${_nl}${_cc.ma}necessary ${_blk}whenever you update your Kitsu watch`,
    `${_nl}list, using the https://kitsu.io website.`,
    '',
    ...getNoArgSyntax(['rc', 'rebuild-cache']),
  ]);
}

function displayRefreshTokenHelp() {
  Logger.chainInfo([
    '',
    `${_hd}Refresh Access Token:`,
    `${_nl}Refreshes your current access token. This will`,
    `${_nl}only be ${_cc.ma}necessary ${_blk}if your current token`,
    `${_nl}expires.`,
    '',
    `${_nl}Tokens tend to be valid for a long time, so this`,
    `${_nl}isn't a flag you'll be using very often.`,
    '',
    ...getNoArgSyntax(['rt', 'refresh-token']),
  ]);
}

function getNoArgSyntax(flags: [string, string]) {
  const [short, long] = flags;
  return [
    `${_shd}Default Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_x}[${_fl}-${short} ${_x}| ${_fl}--${long}${_x}]`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-${short}`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--${long}`,
  ];
}

function getDefaultHelp() {
  return [
    `${_hd}Default Usage`,
    `${_nl}Scan the current working directory for the`,
    `${_nl}specified anime name with episode number, then`,
    `${_nl}updates your progress on Kitsu for that anime`,
    `${_nl}using the specified episode number.`,
    '',
    `${_nl}If the anime file on disk is using a different`,
    `${_nl}numbering schema than Kitsu, then you can use`,
    `${_nl}${_arg}<fep>${_blk} to set episode progress manually. This`,
    `${_nl}will force Kitsu to update your progress to ${_arg}<fep>${_blk}.`,
    '',
    `${_nl}${_cc.ma}NOTE:${_blk} If the ${_arg}<name>${_blk} you use returns multiple`,
    `${_nl}results, the program will display them and exit.`,
    `${_nl}This allows you to try again with a more specific`,
    `${_nl}${_arg}<name>${_blk}.`,
    '',
    ...getDefaultSyntax(),
  ];
}

function getDefaultSyntax() {
  return [
    `${_shd}Default Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_arg}<name> <ep> <fep>`,
    '',
    `${_shd}Details:${_ind1}`,
    `${_ind1}${_arg}name${_x}   Full or partial name of an existing anime on disk`,
    ' ',
    `${_ind1}${_arg}ep${_x}     Episode number of anime ${_arg}<name>${_x} on disk`,
    ' ',
    `${_ind1}${_arg}fep${_x}    ${_cc.ma}(Optional)${_x} Update Kitsu progress with ${_arg}<fep>`,
    `${_ind2}${_x}    instead of ${_arg}<ep>`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_arg}"boku no hero" 10`,
    `${_ind1}${_cc.byw}aniwatch ${_arg}berserk 3`,
    `${_ind1}${_cc.byw}aniwatch ${_arg}bleach 367 1`,
  ];
}

function getSimpleFlagHelp() {
  return [
    `${_hd}Simple Flag Usage`,
    `${_nl}These are flags that can only be used by themselves`,
    `${_nl}without arguments. If an attempt is made to use them`,
    `${_nl}with other flags or arguments, an error will occur`,
    '',
    ...getSimpleFlagSyntax(),
  ];
}

function getSimpleFlagSyntax() {
  return [
    `${_shd}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_x}[ ${_fl}-h  ${_x}| ${_fl}--help${_x}            ]`,
    `${_ind2}${_ind2}[ ${_fl}-p  ${_x}| ${_fl}--profile${_x}         ]`,
    `${_ind2}${_ind2}[ ${_fl}-rp ${_x}| ${_fl}--rebuild-profile${_x} ]`,
    `${_ind2}${_ind2}[ ${_fl}-c  ${_x}| ${_fl}--cache${_x}           ]`,
    `${_ind2}${_ind2}[ ${_fl}-rc ${_x}| ${_fl}--rebuild-cache${_x}   ]`,
    `${_ind2}${_ind2}[ ${_fl}-rt ${_x}| ${_fl}--refresh-token${_x}   ]`,
    '',
    `${_shd}Details:`,
    `${_ind1}${_fl}-p${_x}    Displays the currently logged in profile`,
    '',
    `${_ind1}${_fl}-rp${_x}   Rebuilds currently saved profile information`,
    `${_ind2}   using latest Kitsu data. ${_blk}This is necessary`,
    `${_ind2}   ${_blk}if you want up-to-date months/hours watched`,
    `${_ind2}   ${_blk}info.`,
    '',
    `${_ind1}${_fl}-c${_x}    Displays all cached information`,
    '',
    `${_ind1}${_fl}-rc${_x}   Rebuilds currently saved cache using latest`,
    `${_ind2}   Kitsu data. ${_blk}This is necessary when you update`,
    `${_ind2}   ${_blk}your "currently watching" list on Kitsu.`,
    '',
    `${_ind1}${_fl}-rt${_x}   Refresh access token. ${_blk}Only necessary if the`,
    `${_ind2}   ${_blk}current Access Token expires.`,
    '',
    `${_ind1}${_fl}-h${_x}    Displays all help info including this one`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-p`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--profile`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-rc`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--rebuild-cache`,
  ];
}

function getComplexFlagHelp() {
  return [...getFindAnimeHelp(), '', '', ...getRSSFeedHelp()];
}

function getFindAnimeHelp() {
  return [
    `${_hd}Find Anime:`,
    `${_nl}This flag allows you to lookup an anime that already`,
    `${_nl}exists in your "currently watching" list, which is`,
    `${_nl}cached on your disk.`,
    '',
    `${_nl}${_cc.ma}NOTE:${_blk} If the anime is not found, either it was typed`,
    `${_nl}incorrectly or it needs to be added to your watch`,
    `${_nl}list. If you add it to your watch list, you'll need`,
    `${_nl}to rebuild the cache with ${_fl}-rc ${_blk}or ${_fl}--rebuild-cache`,
    '',
    ...getFindAnimeSyntax(),
  ];
}

function getFindAnimeSyntax() {
  return [
    `${_shd}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_x}[${_fl}-f ${_x}| ${_fl}--find-anime${_x}] ${_arg}<name>`,
    '',
    `${_shd}Details:`,
    `${_ind1}${_arg}name    ${_x}Name of an anime in your "currently watching" list`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-f ${_arg}"boku no hero"`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--find-anime ${_arg}berserk`,
  ];
}

function getRSSFeedHelp() {
  return [
    `${_hd}RSS Feed:`,
    `${_nl}Searches ${_x}nyaa.si${_blk} for an anime name filtered by`,
    `${_nl}${_x}SubsPlease ${_blk}and ${_x}1080p${_blk}. This results in the number`,
    `${_nl}of torrents found, file-name of latest torrent`,
    `${_nl}and an RSS Feed link.`,
    '',
    `${_nl}${_cc.ma}NOTE:${_blk} This allows you to quickly set up RSS for your`,
    `${_nl}torrents to be downloaded automatically. The number`,
    `${_nl}of entries should clue you in on whether or not you`,
    `${_nl}need to refine your search.`,
    '',
    ...getRSSFeedSyntax(),
  ];
}

function getRSSFeedSyntax() {
  return [
    `${_shd}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_x}[${_fl}-rss ${_x}| ${_fl}--rss-feed${_x}] ${_arg}<name>`,
    '',
    `${_shd}Details:`,
    `${_ind1}${_arg}name    ${_x}Name of any anime`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-rss ${_arg}"boku no hero"`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--rss-feed ${_arg}berserk`,
  ];
}
