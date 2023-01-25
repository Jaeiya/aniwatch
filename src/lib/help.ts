import { Logger } from './logger.js';

const _chainInfo = Logger.chainInfo;
const _ind1 = ' '.repeat(3);
const _ind2 = ' '.repeat(6);
const _cc = Logger.consoleColors;
const black = _cc.bbk;
/** New Line */
const _nl = `${_ind1}${black}`;

function displayFullHelp() {
  _chainInfo([
    ...getDefaultHelp(),
    '',
    '',
    ...getSimpleFlagHelp(),
    '',
    ...getComplexFlagHelp(),
  ]);
}

function getDefaultHelp() {
  return [
    `${_cc.bwt}Default Usage`,
    `${_nl}Scans the current working directory for the`,
    `${_nl}specified anime name with episode number, then`,
    `${_nl}updates your progress on Kitsu for that anime`,
    `${_nl}using the specified episode number.`,
    '',
    `${_nl}If the anime file on disk is using a different`,
    `${_nl}numbering schema than Kitsu, then you can use`,
    `${_nl}${_cc.yw}<fep>${_cc.bbk} to set episode progress manually. This`,
    `${_nl}will force Kitsu to update your progress to ${_cc.yw}<fep>${_cc.bbk}.`,
    '',
    `${_nl}${_cc.ma}NOTE:${black} If the ${_cc.yw}<name>${black} you use returns multiple`,
    `${_nl}results, the program will display them and exit.`,
    `${_nl}This allows you to try again with a more`,
    `${_nl}specific ${_cc.yw}<name>${_cc.x}.`,
    '',
    `${_cc.bma}Default Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.yw}<name> <ep> <fep>`,
    '',
    `${_cc.bma}Details:${_ind1}`,
    `${_ind1}${_cc.yw}name${_cc.x}   Full or partial name of an existing anime on disk`,
    ' ',
    `${_ind1}${_cc.yw}ep${_cc.x}     Episode number of anime ${_cc.yw}<name>${_cc.x} on disk`,
    ' ',
    `${_ind1}${_cc.yw}fep${_cc.x}    ${_cc.ma}(Optional)${_cc.x} Update Kitsu progress with`,
    `${_ind2}    ${_cc.yw}<fep>${_cc.x} instead of ${_cc.yw}<ep>`,
    '',
    `${_cc.bma}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.yw}"boku no hero" 10`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.yw}berserk 3`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.yw}bleach 367 1`,
  ];
}

function getSimpleFlagHelp() {
  return [
    `${_cc.bwt}Simple Flag Usage`,
    `${_nl}These are flags that can only be used by themselves`,
    `${_nl}without arguments. If an attempt is made to use them`,
    `${_nl}with other flags or arguments, an error will occur`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[ ${_cc.bcn}-p  ${_cc.x}| ${_cc.bcn}--profile${_cc.x}       ] |`,
    `${_ind2}${_ind2}[ ${_cc.bcn}-rc ${_cc.x}| ${_cc.bcn}--rebuild-cache${_cc.x} ] |`,
    `${_ind2}${_ind2}[ ${_cc.bcn}-c  ${_cc.x}| ${_cc.bcn}--cache${_cc.x}         ] |`,
    `${_ind2}${_ind2}[ ${_cc.bcn}-h  ${_cc.x}| ${_cc.bcn}--help${_cc.x}         ] |`,
    '',
    `${_cc.bma}Details:${_ind1}`,
    `${_ind1}${_cc.bcn}-p${_cc.x}    Displays the currently logged in profile`,
    '',
    `${_ind1}${_cc.bcn}-rc${_cc.x}   Rebuilds internal cache. This is necessary when`,
    `${_ind2}   you update your "currently watching" list on Kitsu`,
    '',
    `${_ind1}${_cc.bcn}-c${_cc.x}    Displays all cached information`,
    '',
    `${_ind1}${_cc.bcn}-h${_cc.x}    Displays all help info including this one`,
    '',
    `${_cc.bma}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}-p`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}--profile`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}--rc`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}--rebuild-cache`,
  ];
}

function getComplexFlagHelp() {
  return ['', ...getFindAnimeHelp(), '', '', ...getRSSFeedHelp()];
}

function getFindAnimeHelp() {
  return [
    `${_cc.bwt}Find Anime:`,
    `${_nl}This flag allows you to lookup an anime that already`,
    `${_nl}exists in your "currently watching" list, which is`,
    `${_nl}cached on your disk.`,
    '',
    `${_nl}${_cc.ma}NOTE:${black} If the anime is not found, either it was typed`,
    `${_nl}incorrectly or it needs to be added to your watch`,
    `${_nl}list. If you add it to your watch list, you'll need`,
    `${_nl}to rebuild the cache with ${_cc.bcn}-rc ${_cc.x} or ${_cc.bcn}--rebuild-cache`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[${_cc.bcn}-f ${_cc.x}| ${_cc.bcn}--find-anime${_cc.x}] ${_cc.yw}<name>`,
    '',
    `${_cc.bma}Details:`,
    `${_ind1}${_cc.yw}name    ${_cc.x}Name of an anime in your "currently watching" list`,
    '',
    `${_cc.bma}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}-f ${_cc.yw}"boku no hero"`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}--find-anime ${_cc.yw}berserk`,
  ];
}

function getRSSFeedHelp() {
  return [
    `${_cc.bwt}RSS Feed:`,
    `${_nl}This flag allows you to search ${_cc.x}nyaa.si${_cc.bbk} for an anime`,
    `${_nl}name filtered by ${_cc.x}SubsPlease ${_cc.bbk}and ${_cc.x}1080p${_cc.bbk}. This results`,
    `${_nl}in the number of torrents found, file-name of latest`,
    `${_nl}torrent and an RSS Feed link.`,
    '',
    `${_nl}${_cc.ma}NOTE:${black} This allows you to quickly set up RSS for your`,
    `${_nl}torrents to be downloaded automatically. The number`,
    `${_nl}of entries should clue you in on whether or not you`,
    `${_nl}need to refine your search.`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[${_cc.bcn}-rss ${_cc.x}| ${_cc.bcn}--rss-feed${_cc.x}] ${_cc.bcn}<name>`,
    '',
    `${_cc.bma}Details:`,
    `${_ind1}${_cc.bcn}name    ${_cc.x}Name of any anime`,
    '',
    `${_cc.bma}Examples:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}-rss ${_cc.yw}"boku no hero"`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}--rss-feed ${_cc.yw}berserk`,
  ];
}

export default {
  displayFullHelp,
  getDefaultHelp,
  getSimpleFlagHelp,
  getComplexFlagHelp,
  getFindAnimeHelp,
  getRSSFeedHelp,
};
