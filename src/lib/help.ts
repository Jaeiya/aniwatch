import { Logger } from './logger.js';

const _chainInfo = Logger.chainInfo;
const _cc = Logger.consoleColors;
/** ANSI Clear Char */
const _x = _cc.x;
/** ANSI Bright Black */
const _blk = _cc.bbk;
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
/** 3-Spaced Line */
const _ind1 = ' '.repeat(3);
/** 6-Spaced Line */
const _ind2 = ' '.repeat(6);
/** New Line */
const _nl = `${_ind1}${_blk}`;

export default {
  displayFullHelp,
  displayDefaultHelp,
  displayDefaultSyntax,
  displaySimpleFlagHelp,
  displaySimpleFlagSyntax,
};

type HelpTuple = [aliases: string[], help: string[]];
const _complexHelp: HelpTuple[] = [];
const _simpleHelp: HelpTuple[] = [];

export class Help {
  static readonly colors = {
    /** ANSI Clear Char */
    x: _cc.x,
    /** Default */
    d: _cc.bbk,
    /** Executing Program */
    ex: _cc.byw,
    /** Emphasis */
    em: _cc.ma,
    /** Heading 1*/
    h1: _cc.bwt,
    /** Heading 2*/
    h2: _cc.bma,
    /** Flag */
    f: _cc.bcn,
    /** Argument */
    arg: _cc.yw,
  };

  static readonly textFlowUtils = {
    /** 3-Spaced Indent */
    ind1: _ind1,
    /** 6-Spaced Indent */
    ind2: _ind2,
    /** New Line */
    nl: `${_ind1}${_blk}`,
  };

  static addSimple(aliases: string[], flags: [string, string], help: string[]) {
    _simpleHelp.push([aliases, [...help, ...getNoArgSyntax(flags)]]);
  }

  static addComplex(aliases: string[], help: string[]) {
    _complexHelp.push([aliases, help]);
  }

  static findHelp(alias: string) {
    const allHelp = _simpleHelp.concat(_complexHelp);
    const helpTuple = allHelp.find((h) => h[0].includes(alias));
    if (!helpTuple) return undefined;
    return helpTuple[1];
  }

  static displayHelp(helpStrings: string[]) {
    Logger.chainInfo(helpStrings);
  }
}

function getHelpFromFlag(flag: string) {
  switch (flag) {
    case 'all':
    case 'full':
    case 'get help':
    case 'get all help':
    case 'default':
      return displayFullHelp();

    default:
      Logger.error(`Missing ${_cc.byw}${flag}${_cc.x} help`);
      break;
  }
}

function displayFullHelp() {
  _chainInfo([...getDefaultHelp(), '']);
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

function getNoArgSyntax(flags: [string, string]) {
  const [short, long] = flags;
  return [
    `${_shd}Default Syntax:`,
    `${_nl}${_cc.byw}aniwatch ${_x}[${_fl}-${short} ${_x}| ${_fl}--${long}${_x}]`,
    '',
    `${_shd}Examples:`,
    `${_nl}${_cc.byw}aniwatch ${_fl}-${short}`,
    `${_nl}${_cc.byw}aniwatch ${_fl}--${long}`,
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
    `${_nl}${_cc.byw}aniwatch ${_arg}<name> <ep> <fep>`,
    '',
    `${_shd}Details:${_nl}`,
    `${_nl}${_arg}name${_x}   Full or partial name of an existing anime on disk`,
    ' ',
    `${_nl}${_arg}ep${_x}     Episode number of anime ${_arg}<name>${_x} on disk`,
    ' ',
    `${_nl}${_arg}fep${_x}    ${_cc.ma}(Optional)${_x} Update Kitsu progress with ${_arg}<fep>`,
    `${_ind2}${_x}    instead of ${_arg}<ep>`,
    '',
    `${_shd}Examples:`,
    `${_nl}${_cc.byw}aniwatch ${_arg}"boku no hero" 10`,
    `${_nl}${_cc.byw}aniwatch ${_arg}berserk 3`,
    `${_nl}${_cc.byw}aniwatch ${_arg}bleach 367 1`,
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
    `${_nl}${_cc.byw}aniwatch ${_x}[ ${_fl}-h  ${_x}| ${_fl}--help${_x}            ]`,
    `${_ind2}${_ind2}[ ${_fl}-p  ${_x}| ${_fl}--profile${_x}         ]`,
    `${_ind2}${_ind2}[ ${_fl}-rp ${_x}| ${_fl}--rebuild-profile${_x} ]`,
    `${_ind2}${_ind2}[ ${_fl}-c  ${_x}| ${_fl}--cache${_x}           ]`,
    `${_ind2}${_ind2}[ ${_fl}-rc ${_x}| ${_fl}--rebuild-cache${_x}   ]`,
    `${_ind2}${_ind2}[ ${_fl}-rt ${_x}| ${_fl}--refresh-token${_x}   ]`,
    '',
    `${_shd}Details:`,
    `${_nl}${_fl}-p${_x}    Displays the currently logged in profile`,
    '',
    `${_nl}${_fl}-rp${_x}   Rebuilds currently saved profile information`,
    `${_ind2}   using latest Kitsu data. ${_blk}This is necessary`,
    `${_ind2}   ${_blk}if you want up-to-date months/hours watched`,
    `${_ind2}   ${_blk}info.`,
    '',
    `${_nl}${_fl}-c${_x}    Displays all cached information`,
    '',
    `${_nl}${_fl}-rc${_x}   Rebuilds currently saved cache using latest`,
    `${_ind2}   Kitsu data. ${_blk}This is necessary when you update`,
    `${_ind2}   ${_blk}your "currently watching" list on Kitsu.`,
    '',
    `${_nl}${_fl}-rt${_x}   Refresh access token. ${_blk}Only necessary if the`,
    `${_ind2}   ${_blk}current Access Token expires.`,
    '',
    `${_nl}${_fl}-h${_x}    Displays all help info including this one`,
    '',
    `${_shd}Examples:`,
    `${_nl}${_cc.byw}aniwatch ${_fl}-p`,
    `${_nl}${_cc.byw}aniwatch ${_fl}--profile`,
    `${_nl}${_cc.byw}aniwatch ${_fl}-rc`,
    `${_nl}${_cc.byw}aniwatch ${_fl}--rebuild-cache`,
  ];
}
