import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';

const { h1 } = Help.colors;
const { nl } = Help.textFlowUtils;

export class RebuildProfileFlag implements CLIFlag {
  name: CLIFlagName = ['rp', 'rebuild-profile'];
  type: CLIFlagType = 'simple';

  helpAliases: string[] = [
    ...this.name,
    'rebuild profile',
    'reload profile',
    'load profile',
  ];

  shortHelpDisplay = 'Rebuilds your profile data from Kitsu.';

  helpDisplay: string[] = [
    `${h1}Rebuild Profile:`,
    `${nl}Rebuilds your profile data from Kitsu. This is`,
    `${nl}useful if you want up-to-date watch time info`,
    `${nl}after you've watched an episode.`,
    '',
  ];

  exec = Kitsu.rebuildProfile;
}
