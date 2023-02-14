import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import K from '../../kitsu/kitsu.js';

const { h1 } = Help.colors;
const { nl } = Help.textFlowUtils;

export class CacheFlag implements CLIFlag {
  name: CLIFlagName = ['c', 'cache'];
  type: CLIFlagType = 'simple';

  helpAliases: string[] = [
    ...this.name,
    'display cache',
    'show cache',
    'get cache',
    'lookup cache',
    'list cache',
  ];

  shortHelpDisplay = 'Displays all currently Cached information.';

  helpDisplay: string[] = [
    `${h1}Display Cache:`,
    `${nl}This flag allows you to display the currently saved`,
    `${nl}cache information.`,
    '',
  ];

  exec = K.displayCacheInfo;
}
