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

export default {
  displayFullHelp,
  displayDefaultHelp,
  displaySimpleFlagHelp,
  displayFlagHelp,
  displayComplexFlagHelp,
  displayFindAnimeHelp,
  getFindAnimeHelp,
  getRSSFeedHelp,
};

function displayFullHelp() {
  _chainInfo([
    ...getDefaultHelp(),
    '',
    '',
    ...getSimpleFlagHelp(),
    '',
    '',
    ...getComplexFlagHelp(),
  ]);
}

function displayDefaultHelp() {
  Logger.chainInfo([...getDefaultHelp()]);
}

function displaySimpleFlagHelp() {
  Logger.chainInfo(['', ...getSimpleFlagHelp()]);
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
    `${_ind1}${_cc.byw}aniwatch ${_fl}--rc`,
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
    `${_nl}This flag allows you to search ${_x}nyaa.si${_blk} for an anime`,
    `${_nl}name filtered by ${_x}SubsPlease ${_blk}and ${_x}1080p${_blk}. This results`,
    `${_nl}in the number of torrents found, file-name of latest`,
    `${_nl}torrent and an RSS Feed link.`,
    '',
    `${_nl}${_cc.ma}NOTE:${_blk} This allows you to quickly set up RSS for your`,
    `${_nl}torrents to be downloaded automatically. The number`,
    `${_nl}of entries should clue you in on whether or not you`,
    `${_nl}need to refine your search.`,
    '',
    `${_shd}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_x}[${_fl}-rss ${_x}| ${_fl}--rss-feed${_x}] ${_fl}<name>`,
    '',
    `${_shd}Details:`,
    `${_ind1}${_fl}name    ${_x}Name of any anime`,
    '',
    `${_shd}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}-rss ${_arg}"boku no hero"`,
    `${_ind1}${_cc.byw}aniwatch ${_fl}--rss-feed ${_arg}berserk`,
  ];
}
