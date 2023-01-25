import { Logger } from './logger.js';

const _chainInfo = Logger.chainInfo;
const _ind1 = ' '.repeat(3);
const _ind2 = ' '.repeat(6);
const _cc = Logger.consoleColors;

function displayFullHelp() {
  _chainInfo([
    ...getDefaultHelp(),
    '',
    '',
    '',
    '',
    ...getSimpleFlagHelp(),
    '',
    '',
    '',
    '',
    ...getComplexFlagHelp(),
  ]);
}

function getDefaultHelp() {
  return [
    `${_cc.bma}Description`,
    `${_ind1}${_cc.bbk}Scans the current working directory for the`,
    `${_ind1}${_cc.bbk}specified anime name with episode number, then`,
    `${_ind1}${_cc.bbk}updates your progress on Kitsu for that anime`,
    `${_ind1}${_cc.bbk}using the specified episode number.`,
    '',
    `${_ind1}${_cc.bbk}If the anime file on disk is using a different`,
    `${_ind1}${_cc.bbk}numbering schema than Kitsu, then you can use`,
    `${_ind1}${_cc.bbk}${_cc.bcn}<fep>${_cc.bbk} to set episode progress manually. This`,
    `${_ind1}${_cc.bbk}will force Kitsu to update your progress to ${_cc.bcn}<fep>${_cc.bbk}.`,
    '',
    `${_cc.bma}Default Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.bcn}<name> <ep> <fep>`,
    '',
    `${_cc.bma}Details:${_ind1}`,
    `${_ind1}${_cc.bcn}name${_cc.x}   Name of an existing anime on disk`,
    ' ',
    `${_ind1}${_cc.bcn}ep${_cc.x}     Episode number of anime ${_cc.bcn}<name>${_cc.x} on disk`,
    ' ',
    `${_ind1}${_cc.bcn}fep${_cc.x}    ${_cc.bma}(Optional)${_cc.x} Update Kitsu progress with`,
    `${_ind2}    ${_cc.bcn}<fep>${_cc.x} instead of ${_cc.bcn}<ep>`,
  ];
}

function getSimpleFlagHelp() {
  return [
    `${_cc.bma}Simple Flags:`,
    `${_ind1}${_cc.bbk}These are flags that can only be used by themselves`,
    `${_ind1}${_cc.bbk}without arguments. If an attempt is made to use them`,
    `${_ind1}${_cc.bbk}with other flags or arguments, an error will occur`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[ ${_cc.bcn}-p  ${_cc.x}| ${_cc.bcn}--profile${_cc.x}       ] |`,
    `${_ind2}${_ind2}[ ${_cc.bcn}-rc ${_cc.x}| ${_cc.bcn}--rebuild-cache${_cc.x} ] |`,
    `${_ind2}${_ind2}[ ${_cc.bcn}-c  ${_cc.x}| ${_cc.bcn}--cache${_cc.x}         ] |`,
    '',
    `${_cc.bma}Details:${_ind1}`,
    `${_ind1}${_cc.bcn}-p${_cc.x}    Displays the currently logged in profile`,
    '',
    `${_ind1}${_cc.bcn}-rc${_cc.x}   Rebuilds internal cache. This is necessary when`,
    `${_ind2}   you update your "currently watching" list on Kitsu`,
    '',
    `${_ind1}${_cc.bcn}-c${_cc.x}    Displays all cached information`,
  ];
}

function getComplexFlagHelp() {
  return [
    `${_cc.bma}Complex Flags:`,
    `${_ind1}${_cc.bbk}These are flags that require 1 or more arguments or`,
    `${_ind1}${_cc.bbk}flags, in order to work properly.`,
    '',
    ...getFindAnimeHelp(),
    '',
    '',
    ...getRSSFeedHelp(),
  ];
}

function getFindAnimeHelp() {
  return [
    `${_cc.yw}Find Anime:`,
    `${_ind1}${_cc.bbk}This flag allows you to lookup an anime that already`,
    `${_ind1}${_cc.bbk}exists in your "currently watching" list, which is`,
    `${_ind1}${_cc.bbk}cached on your disk.`,
    '',
    `${_ind1}${_cc.rd}NOTE:${_cc.x}${_cc.x} If the anime is not found, either it was typed`,
    `${_ind1}incorrectly or it needs to be added to your watch`,
    `${_ind1}list. If you add it to your watch list, you'll need`,
    `${_ind1}to rebuild the cache with ${_cc.bcn}-rc ${_cc.x} or ${_cc.bcn}--rebuild-cache`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[${_cc.bcn}-f ${_cc.x}| ${_cc.bcn}--find-anime${_cc.x}] ${_cc.bcn}<name>`,
    '',
    `${_cc.bma}Details:`,
    `${_ind1}${_cc.bcn}name    ${_cc.x}Name of an anime in your "currently watching" list`,
  ];
}

function getRSSFeedHelp() {
  return [
    `${_cc.yw}RSS Feed:`,
    `${_ind1}${_cc.bbk}This flag allows you to search ${_cc.x}nyaa.si${_cc.bbk} for an anime`,
    `${_ind1}${_cc.bbk}name filtered by ${_cc.x}SubsPlease ${_cc.bbk}and ${_cc.x}1080p${_cc.bbk}. This results`,
    `${_ind1}${_cc.bbk}in the number of torrents found, file-name of latest`,
    `${_ind1}${_cc.bbk}torrent and an RSS Feed link.`,
    '',
    `${_ind1}${_cc.rd}NOTE:${_cc.x} This allows you to quickly set up RSS for your`,
    `${_ind1}torrents to be downloaded automatically. The number`,
    `${_ind1}of entries should clue you in on whether or not you`,
    `${_ind1}need to refine your search.`,
    '',
    `${_cc.bma}Syntax:`,
    `${_ind1}${_cc.byw}aniwatch ${_cc.x}[${_cc.bcn}-rss ${_cc.x}| ${_cc.bcn}--rss-feed${_cc.x}] ${_cc.bcn}<name>`,
    '',
    `${_cc.bma}Details:`,
    `${_ind1}${_cc.bcn}name    ${_cc.x}Name of any anime`,
  ];
}

export default {
  getFullHelp: displayFullHelp,
  getDefaultHelp,
  getSimpleFlagHelp,
  getComplexFlagHelp,
  getFindAnimeHelp,
  getRSSFeedHelp,
};
